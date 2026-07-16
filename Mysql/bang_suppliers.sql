USE pharmakeep_db;
CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    vat_tax_id VARCHAR(50) NOT NULL,
    company_address TEXT NOT NULL,
    contact_email VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    total_orders INT DEFAULT 0,
    outstanding_balance DECIMAL(15, 2) DEFAULT 0.00,
    partnership_status ENUM('active', 'on_hold', 'terminated') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);