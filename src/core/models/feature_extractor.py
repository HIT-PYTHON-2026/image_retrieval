import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import numpy as np

class FeatureExtractor:
    """
    Lớp xử lý trích xuất đặc trưng ảnh bằng ResNet50 theo phong cách OOP chuyên nghiệp.
    """

    def __init__(self):
        """
        Khởi tạo mô hình và các bước tiền xử lý ảnh.
        """
        try:
            print("Đang khởi tạo bộ trích xuất đặc trưng...")
            #tải model resnet50
            self.model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
            #tách lớp cuối FC(Fully Connected) của model để trích xuất đặc trưng
            self.model = nn.Sequential(*list(self.model.children())[:-1])
            self.model.eval()   #chuyển sang Evaluation mode *

            #Tiền xử lý ảnh
            self.resizer = transforms.Resize(256)       #resize về 256 giữ tỉ lệ ảnh
            self.cropper = transforms.CenterCrop(224)   #cắt ảnh về tỉ lệ chuẩn 224x224
            self.to_tensor = transforms.ToTensor()      #chuyển ảnh về dạng số 0-1
            #chuẩn hóa
            self.normalizer = transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
            print("Khởi tạo mô hình ResNet50 thành công.")
        except Exception as e:
            print(f"Lỗi khởi tạo mô hình: {e}")
            raise e
    def extract_features(self, image):
        """
        Trích xuất vector đặc trưng từ đường dẫn ảnh được cung cấp.
        
        Args:
            image: Đường dẫn đến ảnh.
            
        Returns:
            numpy.ndarray: Vector đặc trưng (1, 2048) hoặc None nếu lỗi.
        """
        try:
            #đọc ảnh và ép về RGB (tránh xung đột) 
            img = Image.open(image).convert('RGB')
            
            #tiền xử lý ảnh
            img = self.resizer(img)
            img = self.cropper(img)
            tensor = self.to_tensor(img)
            tensor = self.normalizer(tensor)
            
            #thêm chiều Batch(số lượng ảnh) vì yêu cầu đầu vào 4D (Batch = 1)
            tensor = tensor.unsqueeze(0)

            with torch.no_grad(): #tắt tính đạo hàm tiết kiệm bộ nhớ
                feature = self.model(tensor)
                
                #duỗi thằng vector đặc trưng
                feature = torch.flatten(feature, start_dim=1)

            return feature.cpu().numpy()
        except Exception as e:
            print(f"Lỗi không xác định: {e}")
            return None