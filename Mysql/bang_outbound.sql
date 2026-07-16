USE pharmakeep_db;

-- 1. BẢNG THÔNG TIN CHUNG CỦA PHIẾU XUẤT
CREATE TABLE IF NOT EXISTS outbound_receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    target_location VARCHAR(255) NOT NULL, -- Khớp với ô Target Location *
    dispatch_reason VARCHAR(100) NOT NULL,  -- Khớp với ô Dispatch Reason * (transfer, supply, disposal)
    dispatch_date DATE NOT NULL,            -- Khớp với ô Dispatch Date *
    remarks TEXT NULL,                      -- Khớp với ô Justification / Remarks
    status VARCHAR(50) DEFAULT 'Completed', -- Trạng thái phiếu (Ví dụ: Completed, Pending)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. BẢNG CHI TIẾT DANH SÁCH THUỐC XUẤT KHO (ITEMS TO DISPATCH)
CREATE TABLE IF NOT EXISTS outbound_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    outbound_id INT NOT NULL,               -- Liên kết với id của bảng outbound_receipts ở trên
    medicine_id INT NOT NULL,               -- Liên kết với id của bảng medicines (Medicine in Stock *)
    quantity INT NOT NULL,                  -- Số lượng xuất (Qty *)
    
    -- Thiết lập khóa ngoại (Foreign Keys) để ràng buộc dữ liệu chính xác
    CONSTRAINT fk_outbound_receipt FOREIGN KEY (outbound_id) 
        REFERENCES outbound_receipts(id) ON DELETE CASCADE,
        
    CONSTRAINT fk_outbound_medicine FOREIGN KEY (medicine_id) 
        REFERENCES medicines(id) ON DELETE RESTRICT
);