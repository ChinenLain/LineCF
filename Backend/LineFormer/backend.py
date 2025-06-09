from flask import Flask, request, jsonify
import numpy as np
import cv2
import os
import uuid
import traceback
import logging
import tempfile
import shutil
import time
import atexit
from threading import Lock
import infer
import line_utils

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('lineformer_backend')

app = Flask(__name__)

# 模型初始化
CKPT = "iter_3000.pth"
CONFIG = "lineformer_swin_t_config.py"
DEVICE = "cpu"
try:
    infer.load_model(CONFIG, CKPT, DEVICE)
    logger.info("模型加载成功")
except Exception as e:
    logger.error(f"模型加载失败: {str(e)}")

# 配置目录
UPLOAD_FOLDER = 'uploads'
RESULTS_FOLDER = 'results'
SAVE_FOLDER = 'saved_charts'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)
os.makedirs(SAVE_FOLDER, exist_ok=True)

# 创建临时目录
TEMP_DIR = tempfile.mkdtemp(dir=UPLOAD_FOLDER)
logger.info(f"创建临时目录: {TEMP_DIR}")

# 注册清理函数
@atexit.register
def cleanup():
    try:
        logger.info("应用退出，清理临时目录...")
        shutil.rmtree(TEMP_DIR, ignore_errors=True)
        logger.info("临时目录清理完成")
    except Exception as e:
        logger.warning(f"清理临时目录失败: {str(e)}")

# 并发控制锁
processing_lock = Lock()

def process_line_data(line_dataseries):
    """处理线特征数据，兼容多种格式"""
    formatted_series = []
    for line in line_dataseries:
        points = []
        for p in line:
            if isinstance(p, (list, tuple)) and len(p) >= 2:
                points.append({"x": float(p[0]), "y": float(p[1])})
            elif isinstance(p, dict) and 'x' in p and 'y' in p:
                points.append({"x": float(p['x']), "y": float(p['y'])})
            else:
                logger.warning(f"无法解析的点数据: {type(p)} - {p}")
        formatted_series.append(points)
    return formatted_series

@app.route('/api/trans4line/', methods=['POST'])
def trans4line():
    with processing_lock:  # 确保单线程处理
        return _trans4line_impl()

def _trans4line_impl():
    """处理图片提取线特征"""
    img_path = None
    
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Empty filename'}), 400

        # 生成唯一文件名
        file_uuid = str(uuid.uuid4())
        img_filename = f"{file_uuid}.png"
        img_path = os.path.join(TEMP_DIR, img_filename)
        
        # 确保目录存在
        os.makedirs(os.path.dirname(img_path), exist_ok=True)
        
        # 保存文件
        file.save(img_path)
        logger.info(f"保存临时文件到: {img_path}")
        
        # 读取图像(避免锁定文件)
        img = None
        with open(img_path, 'rb') as f:
            img_data = f.read()
            img = cv2.imdecode(np.frombuffer(img_data, np.uint8), cv2.IMREAD_COLOR)
        
        if img is None:
            logger.error(f"无法读取图像文件: {img_path}")
            return jsonify({'error': 'Invalid image format or corrupted file'}), 400
            
        logger.info(f"成功加载图像: {img.shape}")
        
        # 获取线特征数据
        try:
            line_dataseries = infer.get_dataseries(img)
            # 记录第一行数据用于调试
            if line_dataseries:
                first_line = line_dataseries[0]
                if first_line:
                    logger.info(f"第一行数据类型: {type(first_line[0])}, 值: {first_line[0]}")
        except Exception as e:
            logger.error(f"线特征提取失败: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({'error': f'Feature extraction failed: {str(e)}'}), 500
        
        # 转换数据格式
        formatted_series = process_line_data(line_dataseries)
        
        # 可视化结果（可选）
        try:
            # 尝试转换为点数组格式
            try:
                points_array = line_utils.points_to_array(line_dataseries)
            except Exception as e:
                logger.warning(f"标准点转换失败: {str(e)}")
                # 尝试手动转换
                points_array = []
                for line in line_dataseries:
                    arr_line = []
                    for p in line:
                        if isinstance(p, (list, tuple)):
                            arr_line.append(p)
                        elif isinstance(p, dict):
                            arr_line.append([p['x'], p['y']])
                    points_array.append(arr_line)
            
            vis_img = line_utils.draw_lines(img, points_array)
            result_path = os.path.join(RESULTS_FOLDER, f"result_{file_uuid}.png")
            cv2.imwrite(result_path, vis_img)
            logger.info(f"结果图像保存到: {result_path}")
        except Exception as e:
            logger.warning(f"结果图像保存失败: {str(e)}")
        
        return jsonify(formatted_series)
    except Exception as e:
        logger.error(f"处理请求时发生错误: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500
    finally:
        # 确保释放资源
        if 'img' in locals():
            del img
        
        # 删除临时文件
        if img_path and os.path.exists(img_path):
            for attempt in range(3):  # 最多尝试3次
                try:
                    os.remove(img_path)
                    logger.info(f"成功删除临时文件: {img_path}")
                    break
                except PermissionError as pe:
                    if attempt < 2:
                        logger.warning(f"文件被锁定，等待后重试... ({attempt+1}/3)")
                        time.sleep(0.5)  # 等待500ms
                    else:
                        logger.error(f"多次尝试后无法删除文件: {str(pe)}")
                except Exception as e:
                    logger.error(f"删除文件失败: {str(e)}")

@app.route('/api/savechart/', methods=['POST'])
def savechart():
    """保存图表数据"""
    try:
        # 获取表单数据
        uuid_val = request.form.get('uuid')
        svg_file = request.files.get('svg')
        csv_file = request.files.get('csv')
        img_file = request.files.get('image')
        
        if not all([svg_file, csv_file, img_file, uuid_val]):
            logger.error("缺少必要的字段或文件")
            return jsonify({'error': 'Missing required fields'}), 400

        # 创建UUID目录
        uuid_dir = os.path.join(SAVE_FOLDER, uuid_val)
        os.makedirs(uuid_dir, exist_ok=True)
        logger.info(f"创建保存目录: {uuid_dir}")
        
        # 保存文件
        svg_path = os.path.join(uuid_dir, "chart.svg")
        svg_file.save(svg_path)
        
        csv_path = os.path.join(uuid_dir, "data.csv")
        csv_file.save(csv_path)
        
        img_path = os.path.join(uuid_dir, "original.png")
        img_file.save(img_path)
        
        logger.info(f"成功保存图表数据: {svg_path}, {csv_path}, {img_path}")
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        logger.error(f"保存图表时出错: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查端点"""
    try:
        # 简单检查模型是否加载成功
        if 'infer' in globals() and infer is not None:
            return jsonify({'status': 'healthy', 'model_loaded': True}), 200
        return jsonify({'status': 'warning', 'model_loaded': False}), 200
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)