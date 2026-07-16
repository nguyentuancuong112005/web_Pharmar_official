CREATE DATABASE IF NOT EXISTS pharmakeep_db;
USE pharmakeep_db;

CREATE TABLE medicines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã SKU / Barcode - Bắt buộc',
    medicine_name VARCHAR(255) NOT NULL COMMENT 'Tên thuốc - Bắt buộc',
    active_ingredients TEXT COMMENT 'Thành phần hoạt chất',
    base_unit VARCHAR(50) NOT NULL COMMENT 'Đơn vị tính (Tablet, Box...) - Bắt buộc',
    storage_condition VARCHAR(100) COMMENT 'Điều kiện bảo quản',
    status VARCHAR(50) DEFAULT 'Active' COMMENT 'Trạng thái hoạt động (Active/Inactive)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời gian tạo'
);