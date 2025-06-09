import infer
import cv2
import line_utils

img_input = input("图片名：")
img_path = "demo/" + img_input + ".jpg"
img = cv2.imread(img_path) # BGR format

CKPT = "iter_3000.pth"
CONFIG = "lineformer_swin_t_config.py"
DEVICE = "cpu"

infer.load_model(CONFIG, CKPT, DEVICE)
line_dataseries = infer.get_dataseries(img)

# Visualize extracted line keypoints
img = line_utils.draw_lines(img, line_utils.points_to_array(line_dataseries))
    
img_outpath = "demo/" + img_input + "_result.png"
cv2.imwrite(img_outpath, img)
print("\n=== 图标结果输出完成 ===")

#print("\n=== 提取的图表数据 ===")
#for line_idx, line in enumerate(line_dataseries):
#    print(f"\n—— 折线 {line_idx+1} ——")
#    for point in line:
#        x = round(point['x'], 2)  # 保留2位小数
#        y = round(point['y'], 2)
#        print(f"坐标点 | X: {x:<8} Y: {y:<8}")
#    print(f"本折线共包含 {len(line)} 个数据点")
#
#print("\n=== 数据提取完成 ===")

