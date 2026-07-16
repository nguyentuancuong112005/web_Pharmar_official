USE pharmakeep_db;

-- 1. BẢNG THÔNG TIN CHUNG CỦA PHIẾU NHẬP KHO
CREATE TABLE IF NOT EXISTS inbound_receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NOT NULL,               -- Liên kết với id của bảng suppliers (Supplier *)
    reference_no VARCHAR(100) NULL,         -- Khớp với ô Reference / Invoice No.
    received_date DATE NOT NULL,            -- Khớp với ô Received Date *
    delivery_notes TEXT NULL,               -- Khớp với ô Delivery Notes
    status VARCHAR(50) DEFAULT 'Completed', -- Trạng thái phiếu
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_inbound_supplier FOREIGN KEY (supplier_id) 
        REFERENCES suppliers(id) ON DELETE RESTRICT
);

-- 2. BẢNG CHI TIẾT DANH SÁCH THUỐC NHẬP KHO (INCOMING ITEMS)
CREATE TABLE IF NOT EXISTS inbound_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inbound_id INT NOT NULL,                -- Liên kết với id của bảng inbound_receipts ở trên
    medicine_id INT NOT NULL,               -- Liên kết với id của bảng medicines (Medicine *)
    expiry_date DATE NOT NULL,              -- Khớp với ô Expiry * của từng dòng thuốc
    quantity INT NOT NULL,                  -- Khớp với ô Qty *
    unit_cost DECIMAL(15, 2) NOT NULL,      -- Khớp với ô Cost * (Giá nhập)
    
    CONSTRAINT fk_inbound_receipt FOREIGN KEY (inbound_id) 
        REFERENCES inbound_receipts(id) ON DELETE CASCADE,
        
    CONSTRAINT fk_inbound_medicine FOREIGN KEY (medicine_id) 	
        REFERENCES medicines(id) ON DELETE RESTRICT
);