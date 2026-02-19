from typing import Tuple, Optional

import numpy as np

from image_retrieval.src.utils.image_validator import ImageValidator


class Validate_Image_Service:
    def __init__(self):
        self.validator = ImageValidator()

    def validate(
            self,
            image_bytes: bytes,
            filename: str
    ) -> Tuple[bool, str, Optional[np.ndarray]]:
        '''

        :param image_bytes:raw byte của file
        :param filename: tên file gốc
        :return:
        Tuple[bool, str, Optional[np.ndarray]]:
                - success: true nếu hợp lệ, false nếu lỗi
                - message: thông báo chi tiết (lỗi hoặc thành công)
                - image: numpy array nếu hợp lệ, None nếu lỗi
        '''
        #format
        if not self.validator.validate_format(filename):
            supported = ', '.join(sorted(ImageValidator.SUPPORTED_FORMATS))
            return False, f"Định dạng file không được hỗ trợ. Chỉ chấp nhận: {supported}", None

        #size
        file_size_mb = len(image_bytes) / (1024 * 1024)

        if file_size_mb > 10:
            return False, f"File quá lớn ({file_size_mb:.2f}MB). Giới hạn tối đa: 10MB", None
        if file_size_mb < 0.001:  # < 1KB
            return False, "File quá nhỏ hoặc bị lỗi (< 1KB)", None

        image = self.validator.load_image_from_bytes(image_bytes)
        if image is None:
            return False, "Không thể đọc file ảnh. File có thể bị hỏng hoặc không phải ảnh", None

        is_valid, error_msg = self.validator.validate_image(image)
        if not is_valid:
            return False, error_msg, None

        return True, "Ảnh hợp lệ và đạt yêu cầu chất lượng", image