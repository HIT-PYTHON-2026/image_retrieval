from pathlib import Path
from typing import Tuple, Optional

import cv2 as cv
import numpy as np

class BlurDetector:
    '''
    Lớp cung cấp các công cụ kiểm tra độ mờ của hình ảnh

    Sử dụng toán tử Laplacian để tính toán phương sai của các cạnh trong ảnh
    Giá trị phương sai càng thấp, ảnh càng mờ

    Attributes:
        THRESHOLD (float): Giá trị ngưỡng mặc định để phân loại ảnh mờ

    '''

    THRESHOLD=30.0

    @staticmethod
    def is_blurry(img: np.ndarray, threshold = THRESHOLD) -> Tuple[bool, float]:
        '''

        :param img: ảnh đầu vào có kiểu dữ liệu mảng ndarray
        :param threshold: ngưỡng giới hạn ảnh mờ
        :return:Tuple[bool, float]: score > threshold, score
                bool : trả về true nếu ảnh mờ hơn ngưỡng
                score : độ lệch
        '''
        if img is None or img.size == 0:
            print("Ảnh không tồn tại")

        if len(img.shape) == 3:
            gray_img = cv.cvtColor(img, cv.COLOR_BGR2GRAY)
        else:
            gray_img = img

        score = cv.Laplacian(gray_img, cv.CV_64F).var()

        return score < threshold, score

class ImageValidator:
    '''
    Lớp này kiểm tra tính hợp lệ của tệp tin ảnh bao gồm:
    định dạng tệp, kích thước vật lý (độ phân giải) và độ mờ của ảnh.

    Attributes:
        SUPPORTED_FORMATS (set): Tập hợp các đuôi tệp tin hình ảnh được hệ thống hỗ trợ.
        MIN_IMAGE_SIZE (tuple): Kích thước (rộng, cao) tối thiểu cho phép (mặc định 32x32).
        MAX_IMAGE_SIZE (tuple): Kích thước (rộng, cao) tối đa cho phép (mặc định 10000x10000).
    '''
    SUPPORTED_FORMATS = {'.jpg', '.jpeg', '.png', '.bmp', '.webp', '.tiff'}
    MIN_IMAGE_SIZE = (32, 32)
    MAX_IMAGE_SIZE = (10000, 10000)

    @staticmethod
    def load_image(image_path: str) -> Optional[np.ndarray]:
        try:
            image = cv.imread(str(image_path))
            return image
        except Exception as e:
            print(f"Lỗi load ảnh: {e}")
            return None

    @staticmethod
    def load_image_from_bytes(image_bytes: bytes) -> Optional[np.ndarray]:
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv.imdecode(nparr, cv.IMREAD_COLOR)
            return image
        except Exception as e:
            print(f"Lỗi load ảnh: {e}")
            return None


    @staticmethod
    def validate_format(filename: str) -> bool:
        suffix = Path(filename).suffix.lower()
        return suffix in ImageValidator.SUPPORTED_FORMATS

    @staticmethod
    def validate_size(image: np.ndarray) -> bool:
        '''

        :param image: ảnh định dạng numpy array
        :return: true nếu ảnh đúng kích thước định dạng
        '''
        if image is None or image.size == 0:
            return False

        height, width = image.shape[:2]

        if width < ImageValidator.MIN_IMAGE_SIZE[0] or height < ImageValidator.MIN_IMAGE_SIZE[1]:
            return False

        if width > ImageValidator.MAX_IMAGE_SIZE[0] or height > ImageValidator.MAX_IMAGE_SIZE[1]:
            return False

        return True

    @staticmethod
    def validate_image(image: np.ndarray, blur_threshold: float = BlurDetector.THRESHOLD) -> bool:
        '''
        Hàm kiểm tra ảnh về kích thước và độ mờ

        :param image: ảnh numpy aray
        :param blur_threshold:
        :return: true nếu ảnh hợp lệ
        '''

        if image is None or image.size == 0:
            return False

        if not ImageValidator.validate_size(image):
            return False

        try:
            is_blurry, blur_score = BlurDetector.is_blurry(image, blur_threshold)

            if is_blurry:
                return False
            else:
                return True

        except Exception:
            return False