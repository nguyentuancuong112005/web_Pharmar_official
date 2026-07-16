const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
const path = require('path');
app.use(express.static(__dirname));
app.use(express.static('E:/web_Pharmar/font_end_managements'));

// Cấu hình kết nối MySQL gốc của bạn (GIỮ NGUYÊN)
// Cấu hình kết nối MySQL LOCAL của bạn
const db = mysql.createConnection({
    host: 'localhost',       // Hoặc điền '127.0.0.1'
    port: 3306,              // Cổng MySQL local mặc định (XAMPP/Laragon thường là 3306)
    user: 'root',            // User mặc định dưới máy thường là root
    password: '01012005',            // Mật khẩu local (XAMPP thường để trống '', nếu bạn tự đặt mk thì điền vào nhé)
    database: 'pharmakeep_db' // <-- Thay bằng tên Database dưới máy của bạn
});

// KHAI BÁO THÊM BIẾN POOL DÙNG RIÊNG CHO STOCK (LOCAL)
const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '01012005',            // Điền giống mật khẩu ở trên
    database: 'pharmakeep_db', // <-- Thay bằng tên Database dưới máy của bạn
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();



db.connect((err) => {
    if (err) {
        console.error('Lỗi kết nối MySQL:', err.message);
        return;
    }
    console.log('Đã kết nối thành công tới Database: pharmakeep_db');

    // TRÁNH LỖI COPY TAY: TỰ ĐỘNG ĐỒNG BỘ LẠI TÀI KHOẢN CHUẨN 100% KHI CHẠY SERVER
    const plainPassword = '123456';
    const emailAdmin = 'nguyentuancuong01dng@gmail.com';

    bcrypt.hash(plainPassword, 10, (err, hash) => {
        if (err) return console.error('Lỗi tạo hash:', err);

        // Kiểm tra xem user này đã có chưa, nếu có rồi thì update lại hash chuẩn 60 ký tự
        const checkQuery = 'SELECT * FROM users WHERE email = ?';
        db.query(checkQuery, [emailAdmin], (checkErr, results) => {
            if (results && results.length > 0) {
                const updateQuery = 'UPDATE users SET password_hash = ? WHERE email = ?';
                db.query(updateQuery, [hash, emailAdmin], () => {
                    console.log('=== [HỆ THỐNG] ĐÃ ĐỒNG BỘ MẬT KHẨU 123456 CHUẨN (60 KÝ TỰ) VÀO DB! ===');
                });
            } else {
                const insertQuery = 'INSERT INTO users (email, password_hash) VALUES (?, ?)';
                db.query(insertQuery, [emailAdmin, hash], () => {
                    console.log('=== [HỆ THỐNG] ĐÃ TẠO MỚI TÀI KHOẢN ADMIN CHUẨN VÀO DB! ===');
                });
            }
        });
    });
});

// API Đăng nhập (GIỮ NGUYÊN)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // THAY ĐỔI QUAN TRỌNG: Sửa chữ 'users' thành 'staff' ở câu lệnh SQL
        const query = 'SELECT * FROM staff WHERE email = ?';

        const [staffList] = await db.promise().query(query, [email]);

        // Kiểm tra xem email có tồn tại trong bảng staff không
        if (staffList.length === 0) {
            return res.status(401).json({ message: "Email không tồn tại trong hệ thống." });
        }

        const staffMember = staffList[0];

        // Kiểm tra tài khoản có bị khóa không
        if (staffMember.account_status !== 'active') {
            return res.status(403).json({ message: "Tài khoản của bạn đã bị vô hiệu hóa." });
        }

        // So sánh mật khẩu người dùng nhập với mật khẩu mã hóa trong database
        const isMatch = await bcrypt.compare(password, staffMember.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: "Sai mật khẩu." });
        }

        // Nếu mọi thứ hợp lệ -> Đăng nhập thành công
        res.status(200).json({
            message: "Đăng nhập thành công",
            user: {
                id: staffMember.id,
                name: staffMember.full_name,
                role: staffMember.primary_role
            }
        });

    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        res.status(500).json({ message: "Lỗi hệ thống Server" });
    }
});
app.get('/dashboard', (req, res) => {
    res.sendFile('E:/web_Pharmar/font_end_managements/dashboard/dashboard.html');
});

// API Endpoint xử lý tạo tài khoản nhân viên mới (GIỮ NGUYÊN)
app.post('/api/staff/create', async (req, res) => {
    const {
        fullName, email, phone, role, status,
        password, forcePasswordChange
    } = req.body;

    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Đã đổi 'users' thành 'staff'
        const query = `
            INSERT IGNORE INTO staff (full_name, email, phone_number, primary_role, account_status, password_hash, force_password_change)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(query, [
            fullName,
            email,
            phone || null,
            role,
            status,
            hashedPassword,
            forcePasswordChange ? 1 : 0
        ]);

        res.status(201).json({ message: "Tạo tài khoản nhân viên thành công!" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi hệ thống", error });
    }
});
// đọc bảng staff để hiển thị danh sách nhân viên (GIỮ NGUYÊN)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Đã đổi 'users' thành 'staff'
        const [staffMembers] = await db.promise().query('SELECT * FROM staff WHERE email = ?', [email]);

        if (staffMembers.length === 0) {
            return res.status(401).json({ message: "Email không tồn tại trong hệ thống." });
        }

        const staff = staffMembers[0];

        if (staff.account_status !== 'active') {
            return res.status(403).json({ message: "Tài khoản của bạn đã bị vô hiệu hóa." });
        }

        const isMatch = await bcrypt.compare(password, staff.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: "Sai mật khẩu." });
        }

        if (staff.force_password_change) {
            return res.status(200).json({
                message: "Yêu cầu đổi mật khẩu",
                requirePasswordChange: true
            });
        }

        res.status(200).json({
            message: "Đăng nhập thành công",
            user: { id: staff.id, name: staff.full_name, role: staff.primary_role }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi Server" });
    }
});
// API: Lấy toàn bộ danh sách nhân viên từ bảng staff (GIỮ NGUYÊN)
app.get('/api/staff', async (req, res) => {
    // Nhận dữ liệu bộ lọc từ URL do Frontend gửi lên (ví dụ: ?role=admin&status=active)
    const { role, status, search } = req.query;

    // Câu lệnh SQL gốc: Lấy các cột cần thiết, loại bỏ password_hash để bảo mật
    let query = 'SELECT id, full_name, email, phone_number, primary_role, account_status FROM staff WHERE 1=1';
    let queryParams = [];

    // Nếu Frontend có truyền lên giá trị lọc theo Vai trò (Role)
    if (role) {
        query += ' AND primary_role = ?';
        queryParams.push(role);
    }

    // Lọc chính xác theo Trạng thái (Status)
    if (status && status.trim() !== '') {
        query += ' AND account_status = ?';
        queryParams.push(status);
    }
    // 3. Thanh tìm kiếm (Tìm theo Tên, Email hoặc định dạng NV-00X)
    if (search && search.trim() !== '') {
        const searchKeyword = `%${search.trim()}%`;

        query += ' AND (full_name LIKE ? OR email LIKE ? OR id LIKE ? OR CONCAT("NV-", LPAD(id, 3, "0")) LIKE ?)';
        queryParams.push(searchKeyword, searchKeyword, searchKeyword, searchKeyword);
    }

    // Sắp xếp theo ID giảm dần (Nhân viên mới tạo lọt lên đầu bảng)
    query += ' ORDER BY id DESC';

    try {
        // Thực thi câu lệnh SQL quét database
        const [rows] = await db.promise().query(query, queryParams);

        // Trả dữ liệu mảng nhân viên về cho Frontend dưới dạng JSON
        res.status(200).json(rows);
    } catch (error) {
        console.error("Lỗi khi kết nối lấy danh sách staff:", error);
        res.status(500).json({ message: "Lỗi kết nối cơ sở dữ liệu phía máy chủ." });
    }
});
// API: Cập nhật thông tin nhân viên trực tiếp từ hàng (GIỮ NGUYÊN)
app.put('/api/staff/:id', async (req, res) => {
    const staffId = req.params.id;
    const { full_name, email, primary_role, phone_number, account_status } = req.body;

    // Kiểm tra dữ liệu đầu vào cơ bản
    if (!full_name || !email || !primary_role || !account_status) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ các trường bắt buộc." });
    }

    const query = `
        UPDATE staff 
        SET full_name = ?, email = ?, primary_role = ?, phone_number = ?, account_status = ? 
        WHERE id = ?
    `;

    try {
        const [result] = await db.promise().query(query, [full_name, email, primary_role, phone_number || null, account_status, staffId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy nhân viên cần sửa." });
        }

        res.status(200).json({ message: "Cập nhật thông tin nhân viên thành công!" });
    } catch (error) {
        console.error("Lỗi cập nhật nhân viên:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "Email này đã được sử dụng bởi nhân viên khác." });
        }
        res.status(500).json({ message: "Lỗi hệ thống không thể lưu." });
    }
});
// ==========================================
// API QUẢN LÝ NHÀ CUNG CẤP (SUPPLIERS) -> HOÀN TRẢ GỐC 100% KHÔNG ĐỤNG CHẠY
// ==========================================

// 1. API: Lấy danh sách nhà cung cấp
app.get('/api/suppliers', async (req, res) => {
    try {
        const { status, balance_filter, search } = req.query;

        let query = 'SELECT * FROM suppliers WHERE 1=1';
        let queryParams = [];

        if (status) {
            query += ' AND partnership_status = ?';
            queryParams.push(status);
        }

        if (balance_filter) {
            if (balance_filter === 'has_debt') {
                query += ' AND outstanding_balance > 0';
            } else if (balance_filter === 'clear') {
                query += ' AND outstanding_balance <= 0';
            }
        }

        if (search && search.trim() !== '') {
            const searchKeyword = `%${search.trim()}%`; // Đã sửa lại định dạng chuẩn
            query += ' AND (company_name LIKE ? OR vat_tax_id LIKE ? OR contact_email LIKE ?)';
            queryParams.push(searchKeyword, searchKeyword, searchKeyword);
        }

        query += ' ORDER BY id DESC';

        const [rows] = await db.promise().query(query, queryParams);
        res.status(200).json(rows);

    } catch (error) {
        console.error("Lỗi khi lấy danh sách suppliers:", error);
        res.status(500).json({ message: "Lỗi kết nối cơ sở dữ liệu." });
    }
});
// 3. API: Cập nhật thông tin nhà cung cấp (Sửa trực tiếp)
app.put('/api/suppliers/:id', async (req, res) => {
    const supplierId = req.params.id;
    const {
        company_name, vat_tax_id, company_address,
        contact_email, phone_number, partnership_status, outstanding_balance
    } = req.body;

    const query = `
        UPDATE suppliers 
        SET company_name = ?, vat_tax_id = ?, company_address = ?, 
            contact_email = ?, phone_number = ?, partnership_status = ?, outstanding_balance = ?
        WHERE id = ?
    `;
    const params = [
        company_name, vat_tax_id, company_address, contact_email,
        phone_number, partnership_status, outstanding_balance || 0, supplierId
    ];

    try {
        const [result] = await db.promise().query(query, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy nhà cung cấp để cập nhật." });
        }
        res.status(200).json({ message: "Cập nhật thông tin thành công!" });
    } catch (error) {
        console.error("Lỗi cập nhật supplier:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi cập nhật." });
    }
});

// 4. API: Xóa nhà cung cấp
app.delete('/api/suppliers/:id', async (req, res) => {
    const supplierId = req.params.id;
    const query = 'DELETE FROM suppliers WHERE id = ?';

    try {
        const [result] = await db.promise().query(query, [supplierId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Không tìm thấy nhà cung cấp để xóa." });
        }
        res.status(200).json({ message: "Đã xóa nhà cung cấp thành công!" });
    } catch (error) {
        console.error("Lỗi xóa supplier:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi xóa." });
    }
});

// 2. API: Thêm mới nhà cung cấp
app.post('/api/suppliers', async (req, res) => {
    try {
        const {
            company_name,
            vat_tax_id,
            company_address,
            contact_email,
            phone_number,
            status,
            outstanding_balance
        } = req.body;

        const query = `
            INSERT INTO suppliers 
            (company_name, vat_tax_id, company_address, contact_email, phone_number, partnership_status, outstanding_balance)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            company_name,
            vat_tax_id,
            company_address,
            contact_email,
            phone_number,
            status || 'active',
            outstanding_balance || 0.00
        ];

        const [result] = await db.promise().query(query, params);
        res.status(201).json({
            message: "Thêm nhà cung cấp thành công!",
            id: result.insertId
        });

    } catch (error) {
        console.error("Lỗi khi thêm supplier:", error);
        res.status(500).json({ message: "Lỗi hệ thống không thể lưu nhà cung cấp." });
    }
});
// ==========================================
// API QUẢN LÝ THUỐC (MEDICINES INVENTORY)
// ==========================================

// 1. API: Lấy danh sách thuốc để đổ ra bảng
app.get('/api/medicines', async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT id, sku, medicine_name, status FROM medicines ORDER BY created_at DESC');
        res.status(200).json(rows);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách thuốc:", error);
        res.status(500).json({ message: "Lỗi kết nối cơ sở dữ liệu." });
    }
});

// 2. API: Thêm thuốc mới từ form Add New Medicine
app.post('/api/medicines', async (req, res) => {
    try {
        const { sku, medicine_name, active_ingredients, base_unit, storage_condition } = req.body;

        const query = `
            INSERT INTO medicines (sku, medicine_name, active_ingredients, base_unit, storage_condition) 
            VALUES (?, ?, ?, ?, ?)
        `;
        const params = [sku, medicine_name, active_ingredients, base_unit, storage_condition];

        const [result] = await db.promise().query(query, params);
        res.status(201).json({
            success: true,
            message: "Thêm thuốc thành công!",
            id: result.insertId
        });
    } catch (error) {
        console.error("Lỗi khi thêm thuốc:", error);
        res.status(500).json({ message: "Lỗi hệ thống không thể lưu thuốc." });
    }
});

// 3. API: Lấy chi tiết 1 loại thuốc (Dành cho nút Detail / Edit)
app.get('/api/medicines/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.promise().query('SELECT * FROM medicines WHERE id = ?', [id]);

        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(404).json({ message: 'Không tìm thấy thông tin thuốc.' });
        }
    } catch (error) {
        console.error("Lỗi lấy chi tiết thuốc:", error);
        res.status(500).json({ message: "Lỗi hệ thống." });
    }
});
// 4. API: Cập nhật thông tin thuốc (Dành cho nút Update Medicine)
app.put('/api/medicines/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { medicine_name, sku, base_unit, storage_condition, status } = req.body;

        const query = `
            UPDATE medicines 
            SET medicine_name = ?, sku = ?, base_unit = ?, storage_condition = ?, status = ?
            WHERE id = ?
        `;
        const params = [medicine_name, sku, base_unit, storage_condition, status || 'Active', id];

        await db.promise().query(query, params);
        res.status(200).json({ success: true, message: "Cập nhật thuốc thành công!" });
    } catch (error) {
        console.error("Lỗi khi cập nhật thuốc:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: "Mã SKU này đã bị trùng với thuốc khác!" });
        }
        res.status(500).json({ success: false, message: "Lỗi hệ thống không thể cập nhật." });
    }
});
// ==========================================

// API lấy danh sách thuốc (id và medicine_name) chuẩn theo bảng medicines
app.get('/api/medicines', async (req, res) => {
    try {
        // Truy vấn đúng bảng medicines lấy id và medicine_name
        const [rows] = await pool.query('SELECT id, medicine_name FROM medicines WHERE status = "Active" ORDER BY medicine_name ASC');
        res.json(rows);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách thuốc:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi tải danh mục thuốc." });
    }
});
// 2. API LẤY DANH SÁCH NHÀ CUNG CẤP (SUPPLIERS)
// ==========================================
app.get('/api/suppliers', async (req, res) => {
    try {
        // Truy vấn lấy id và company_name chuẩn theo ảnh bảng suppliers của bạn
        const [rows] = await pool.query(
            'SELECT id, company_name FROM suppliers WHERE partnership_status = "active" ORDER BY company_name ASC'
        );
        res.json(rows);
    } catch (error) {
        console.error("Lỗi server khi lấy danh mục nhà cung cấp:", error);
        res.status(500).json({ message: "Không thể lấy danh sách nhà cung cấp từ hệ thống." });
    }
});
// API LƯU PHIẾU XUẤT KHO (OUTBOUND)
// ==========================================
app.post('/api/outbound', async (req, res) => {
    // Lấy kết nối riêng để chạy Transaction (đảm bảo an toàn dữ liệu)
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction(); // Bắt đầu quá trình lưu an toàn

        // 1. Nhận dữ liệu bóc tách từ body do client gửi lên
        const { target_location, dispatch_reason, dispatch_date, remarks, items } = req.body;

        // 2. Chèn dữ liệu vào bảng thông tin chung (outbound_receipts)
        const sqlReceipt = `
            INSERT INTO outbound_receipts (target_location, dispatch_reason, dispatch_date, remarks) 
            VALUES (?, ?, ?, ?)
        `;
        const [receiptResult] = await connection.query(sqlReceipt, [target_location, dispatch_reason, dispatch_date, remarks || null]);

        // Lấy ID tự động tăng của phiếu xuất vừa tạo
        const outboundId = receiptResult.insertId;

        // 3. Duyệt mảng danh sách thuốc (items) để chèn vào bảng chi tiết (outbound_items)
        const sqlItem = `
            INSERT INTO outbound_items (outbound_id, medicine_id, quantity) 
            VALUES (?, ?, ?)
        `;

        for (let item of items) {
            // Chỉ chèn nếu hàng có chọn thuốc và có nhập số lượng hợp lệ
            if (item.medicine_id && item.quantity) {
                await connection.query(sqlItem, [outboundId, item.medicine_id, item.quantity]);
            }
        }

        await connection.commit(); // Hoàn thành việc lưu vào DB nếu không có lỗi
        res.status(200).json({ success: true, message: 'Đã lưu phiếu xuất kho thành công!' });

    } catch (error) {
        await connection.rollback(); // Hủy bỏ toàn bộ thao tác nếu xảy ra bất kỳ lỗi gì
        console.error("Lỗi khi lưu phiếu xuất:", error);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống, không thể lưu phiếu xuất.' });
    } finally {
        connection.release(); // Trả lại kết nối cho pool
    }
});
// ==========================================
// API LƯU PHIẾU NHẬP KHO (INBOUND)
// ==========================================
app.post('/api/inbound', async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction(); // Bắt đầu Transaction để an toàn dữ liệu

        // 1. Lấy dữ liệu gửi từ form frontend
        const { supplier_id, reference_no, received_date, delivery_notes, items } = req.body;

        // 2. Lưu vào bảng thông tin chung (inbound_receipts)
        const sqlReceipt = `
            INSERT INTO inbound_receipts (supplier_id, reference_no, received_date, delivery_notes) 
            VALUES (?, ?, ?, ?)
        `;
        const [receiptResult] = await connection.query(sqlReceipt, [
            supplier_id,
            reference_no || null,
            received_date,
            delivery_notes || null
        ]);

        const inboundId = receiptResult.insertId; // Lấy ID của phiếu vừa tạo

        // 3. Duyệt danh sách các mặt hàng thuốc nhập (Incoming Items)
        const sqlItem = `
            INSERT INTO inbound_items (inbound_id, medicine_id, expiry_date, quantity, unit_cost) 
            VALUES (?, ?, ?, ?, ?)
        `;

        for (let item of items) {
            if (item.medicine_id && item.expiry_date && item.quantity && item.unit_cost) {
                await connection.query(sqlItem, [
                    inboundId,
                    item.medicine_id,
                    item.expiry_date,
                    item.quantity,
                    item.unit_cost
                ]);
            }
        }

        await connection.commit(); // Xác nhận lưu thành công tất cả vào DB
        res.status(200).json({ success: true, message: 'Đã lưu phiếu nhập kho thành công!' });

    } catch (error) {
        await connection.rollback(); // Hủy bỏ nếu có bất kỳ lỗi nào xảy ra
        console.error("Lỗi khi lưu phiếu nhập:", error);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống, không thể lưu phiếu nhập.' });
    } finally {
        connection.release();
    }
});
// ==========================================
// API LẤY LỊCH SỬ GIAO DỊCH (TRANSACTIONS HISTORY)
app.get('/api/transactions', async (req, res) => {
    try {
        const { type, entity, date, status } = req.query;

        let conditionsInbound = ['1=1'];
        let conditionsOutbound = ['1=1'];
        let paramsInbound = [];
        let paramsOutbound = [];

        // 1. Chỉ lọc theo Entity nếu người dùng thực sự gõ chữ vào ô search
        if (entity && entity.trim() !== '') {
            conditionsInbound.push("s.company_name LIKE ?");
            paramsInbound.push(`%${entity}%`);

            conditionsOutbound.push("obr.target_location LIKE ?");
            paramsOutbound.push(`%${entity}%`);
        }

        // 2. Chỉ lọc theo Ngày nếu người dùng thực sự chọn ngày (không trống)
        if (date && date.trim() !== '') {
            conditionsInbound.push("ir.received_date = ?");
            paramsInbound.push(date);

            conditionsOutbound.push("obr.dispatch_date = ?");
            paramsOutbound.push(date);
        }

        // 3. Chỉ lọc theo Trạng thái nếu chọn trạng thái cụ thể (bỏ qua 'All Statuses' hoặc rỗng)
        if (status && status !== 'All Statuses' && status.trim() !== '') {
            conditionsInbound.push("ir.status = ?");
            paramsInbound.push(status);

            conditionsOutbound.push("obr.status = ?");
            paramsOutbound.push(status);
        }

        const inboundSQL = `
            SELECT ir.id AS transaction_id, 'Inbound' AS type, s.company_name AS entity_name, 
                   ir.received_date AS date_executed,
                   (SELECT SUM(quantity) FROM inbound_items WHERE inbound_id = ir.id) AS total_qty,
                   (SELECT SUM(quantity * unit_cost) FROM inbound_items WHERE inbound_id = ir.id) AS total_value,
                   ir.status
            FROM inbound_receipts ir
            LEFT JOIN suppliers s ON ir.supplier_id = s.id
            WHERE ${conditionsInbound.join(' AND ')}
        `;

        const outboundSQL = `
            SELECT obr.id AS transaction_id, 'Outbound' AS type, obr.target_location AS entity_name, 
                   obr.dispatch_date AS date_executed,
                   (SELECT SUM(quantity) FROM outbound_items WHERE outbound_id = obr.id) AS total_qty,
                   NULL AS total_value, obr.status
            FROM outbound_receipts obr
            WHERE ${conditionsOutbound.join(' AND ')}
        `;

        let query = "";
        let finalParams = [];

        // Lọc động theo Loại giao dịch
        if (type === 'Inbound') {
            query = `${inboundSQL} ORDER BY date_executed DESC, transaction_id DESC`;
            finalParams = paramsInbound;
        } else if (type === 'Outbound') {
            query = `${outboundSQL} ORDER BY date_executed DESC, transaction_id DESC`;
            finalParams = paramsOutbound;
        } else {
            query = `(${inboundSQL}) UNION ALL (${outboundSQL}) ORDER BY date_executed DESC, transaction_id DESC`;
            finalParams = [...paramsInbound, ...paramsOutbound];
        }

        const [rows] = await pool.query(query, finalParams);
        res.json(rows);

    } catch (error) {
        console.error("Lỗi lấy lịch sử giao dịch:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi tải lịch sử." });
    }
});
app.get('/api/dashboard/total-medicines', async (req, res) => {
    try {
        // Thực hiện câu lệnh đếm tổng số loại thuốc trong bảng danh mục
        const query = "SELECT COUNT(*) AS total FROM medicines";
        const [rows] = await pool.query(query);

        // Trả kết quả về cho Frontend dạng JSON { total: 3 }
        res.json({ total: rows[0].total });
    } catch (error) {
        console.error("Lỗi lấy tổng số thuốc:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi đếm danh mục thuốc." });
    }
});
app.get('/api/dashboard/expired-under-30-days', async (req, res) => {
    try {
        // DATEDIFF(expiry_date, NOW()) lấy ngày hết hạn trừ đi ngày hôm nay
        // Chỉ đếm các thuốc chưa hết hạn nhưng thời gian còn lại dưới 30 ngày
        const query = `
            SELECT COUNT(DISTINCT medicine_id) AS total 
            FROM inbound_items 
            WHERE DATEDIFF(expiry_date, NOW()) >= 0 
              AND DATEDIFF(expiry_date, NOW()) < 30
        `;

        const [rows] = await pool.query(query);
        res.json({ total: rows[0].total });
    } catch (error) {
        console.error("Lỗi đếm số lượng thuốc sắp hết hạn:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi tính toán ngày hết hạn." });
    }
});
app.get('/api/dashboard/expired-total', async (req, res) => {
    try {
        // DATEDIFF <= 0 nghĩa là ngày hết hạn bằng ngày hôm nay hoặc đã trôi qua trong quá khứ
        const query = `
            SELECT COUNT(DISTINCT medicine_id) AS total 
            FROM inbound_items 
            WHERE DATEDIFF(expiry_date, NOW()) <= 0
        `;

        const [rows] = await pool.query(query);
        res.json({ total: rows[0].total });
    } catch (error) {
        console.error("Lỗi đếm số lượng thuốc đã hết hạn:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi thống kê thuốc hết hạn." });
    }
});
app.get('/api/dashboard/stock-movement', async (req, res) => {
    try {
        // Câu lệnh SQL gộp cả 2 bảng, dùng SUM(quantity) để tính tổng số lượng theo từng ngày
        const sqlQuery = `
            SELECT date_label, SUM(total_in) AS total_in, SUM(total_out) AS total_out
            FROM (
                SELECT DATE_FORMAT(ir.received_date, '%d/%m') AS date_label, ii.quantity AS total_in, 0 AS total_out
                FROM inbound_receipts ir
                JOIN inbound_items ii ON ir.id = ii.inbound_id
                WHERE ir.received_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                
                UNION ALL
                
                SELECT DATE_FORMAT(obr.dispatch_date, '%d/%m') AS date_label, 0 AS total_in, oi.quantity AS total_out
                FROM outbound_receipts obr
                JOIN outbound_items oi ON obr.id = oi.outbound_id
                WHERE obr.dispatch_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            ) AS combined_data
            GROUP BY date_label
            ORDER BY STR_TO_DATE(date_label, '%d/%m') ASC
        `;

        const [rows] = await pool.query(sqlQuery);

        // Bóc tách dữ liệu thành các mảng riêng biệt cho Chart.js dễ đọc
        const labels = rows.map(r => r.date_label);
        const stockIn = rows.map(r => r.total_in);
        const stockOut = rows.map(r => r.total_out);

        res.json({ labels, stockIn, stockOut });
    } catch (error) {
        console.error("Lỗi lấy dữ liệu biểu đồ:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi tải biểu đồ." });
    }
});
app.get('/api/dashboard/category-distribution', async (req, res) => {
    try {
        // UPPER(LEFT(sku, 1)) lấy ký tự đầu tiên và viết hoa. 
        // GROUP BY gom các thuốc có cùng chữ cái đầu lại với nhau.
        const sqlQuery = `
            SELECT UPPER(LEFT(sku, 1)) AS category_letter, COUNT(*) AS total
            FROM medicines
            WHERE sku IS NOT NULL AND sku != ''
            GROUP BY UPPER(LEFT(sku, 1))
            ORDER BY category_letter ASC
        `;

        const [rows] = await pool.query(sqlQuery);

        // Tách dữ liệu thành 2 mảng: Mảng chữ cái (labels) và Mảng số lượng (data)
        const labels = rows.map(r => r.category_letter);
        const data = rows.map(r => r.total);

        res.json({ labels, data });
    } catch (error) {
        console.error("Lỗi lấy dữ liệu phân loại SKU:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi tải biểu đồ phân loại." });
    }
});
// ============================================================================
// API: Lấy danh sách thuốc cảnh báo (Hết hàng, sắp hết hàng hoặc sắp hết hạn)
// ============================================================================
app.get('/api/dashboard/critical-alerts', (req, res) => {
    const sqlQuery = `
        SELECT 
            m.medicine_name, 
            m.sku, 
            i.quantity, 
            i.expiry_date
        FROM inbound_items i
        JOIN medicines m ON i.medicine_id = m.id
        WHERE i.quantity <= 10 OR i.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        ORDER BY i.quantity ASC, i.expiry_date ASC
        LIMIT 10;
    `;

    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error("Lỗi khi truy vấn dữ liệu Critical Alerts:", err);
            return res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
        }

        // Trả dữ liệu về cho Frontend dưới dạng JSON
        res.status(200).json(results);
    });
});
// 1. LẤY CHI TIẾT PHIẾU NHẬP (INBOUND)
app.get('/api/inbound/:id', (req, res) => {
    const id = req.params.id;

    // Lấy thông tin chung của phiếu nhập kết hợp với tên nhà cung cấp
    const receiptQuery = `
        SELECT ir.*, s.company_name 
        FROM inbound_receipts ir
        LEFT JOIN suppliers s ON ir.supplier_id = s.id
        WHERE ir.id = ?
    `;

    // Lấy chi tiết các mặt thuốc trong phiếu nhập
    const itemsQuery = `
        SELECT ii.*, m.medicine_name 
        FROM inbound_items ii
        JOIN medicines m ON ii.medicine_id = m.id
        WHERE ii.inbound_id = ?
    `;

    db.query(receiptQuery, [id], (err, receiptRes) => {
        if (err) return res.status(500).json({ error: err.message });
        if (receiptRes.length === 0) return res.status(404).json({ message: "Không tìm thấy phiếu nhập" });

        db.query(itemsQuery, [id], (err, itemsRes) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({
                receipt: receiptRes[0],
                items: itemsRes
            });
        });
    });
});

// CẬP NHẬT CHI TIẾT PHIẾU XUẤT (EDIT OUTBOUND)
app.put('/api/outbound/:id', async (req, res) => {
    const outboundId = req.params.id;
    const { remarks, items } = req.body;

    try {
        // 1. Cập nhật Remarks (Lý do/Ghi chú) trong bảng outbound_receipts
        await new Promise((resolve, reject) => {
            db.query(
                'UPDATE outbound_receipts SET remarks = ? WHERE id = ?',
                [remarks, outboundId],
                (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                }
            );
        });

        // 2. Cập nhật Số lượng xuất của từng dòng mặt hàng trong bảng outbound_items
        if (items && items.length > 0) {
            const updatePromises = items.map(item => {
                return new Promise((resolve, reject) => {
                    db.query(
                        'UPDATE outbound_items SET quantity = ? WHERE id = ? AND outbound_id = ?',
                        [item.quantity, item.item_id, outboundId],
                        (err, result) => {
                            if (err) reject(err);
                            else resolve(result);
                        }
                    );
                });
            });
            await Promise.all(updatePromises);
        }

        res.json({ success: true, message: 'Outbound receipt updated successfully' });

    } catch (error) {
        console.error('Lỗi khi cập nhật Outbound:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật', error: error.message });
    }
});
// CẬP NHẬT PHIẾU NHẬP (INBOUND EDIT)
app.put('/api/inbound/:id', async (req, res) => {
    const inboundId = req.params.id;
    const { delivery_notes, items } = req.body;

    try {
        // 1. Cập nhật Notes vào bảng inbound_receipts
        await new Promise((resolve, reject) => {
            db.query(
                'UPDATE inbound_receipts SET delivery_notes = ? WHERE id = ?',
                [delivery_notes, inboundId],
                (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                }
            );
        });

        // 2. Cập nhật Số lượng, Giá, Hạn sử dụng vào bảng inbound_items
        if (items && items.length > 0) {
            const updatePromises = items.map(item => {
                return new Promise((resolve, reject) => {
                    db.query(
                        'UPDATE inbound_items SET expiry_date = ?, quantity = ?, unit_cost = ? WHERE id = ? AND inbound_id = ?',
                        [item.expiry_date, item.quantity, item.unit_cost, item.item_id, inboundId],
                        (err, result) => {
                            if (err) reject(err);
                            else resolve(result);
                        }
                    );
                });
            });
            await Promise.all(updatePromises);
        }

        res.json({ success: true, message: 'Inbound updated successfully' });

    } catch (error) {
        console.error('Lỗi khi cập nhật Inbound:', error);
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
});
// ==========================================
// LẤY CHI TIẾT PHIẾU XUẤT KHO (OUTBOUND)
// ==========================================
app.get('/api/outbound/:id', (req, res) => {
    const id = req.params.id;

    // Lấy thông tin chung của phiếu xuất
    const receiptQuery = `
        SELECT * FROM outbound_receipts WHERE id = ?
    `;

    // Lấy chi tiết các mặt thuốc trong phiếu xuất
    const itemsQuery = `
        SELECT oi.*, m.medicine_name 
        FROM outbound_items oi
        JOIN medicines m ON oi.medicine_id = m.id
        WHERE oi.outbound_id = ?
    `;

    db.query(receiptQuery, [id], (err, receiptRes) => {
        if (err) return res.status(500).json({ error: err.message });
        if (receiptRes.length === 0) return res.status(404).json({ message: "Không tìm thấy phiếu xuất" });

        db.query(itemsQuery, [id], (err, itemsRes) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({
                receipt: receiptRes[0],
                items: itemsRes
            });
        });
    });
});
// API lấy danh sách thuốc có mã SKU bắt đầu bằng chữ cái được truyền lên
app.get('/api/dashboard/medicines-by-sku', (req, res) => {
    const letter = req.query.letter;

    if (!letter) {
        return res.status(400).json({ error: "Thiếu tham số chữ cái lọc 'letter'" });
    }

    // Câu lệnh SQL: Lọc những sản phẩm có sku bắt đầu bằng chữ cái được gửi lên (ví dụ: 'A%')
    const sql = `SELECT id, sku, medicine_name, base_unit, status 
                 FROM medicines 
                 WHERE sku LIKE ? 
                 ORDER BY medicine_name ASC`;

    // Ở đây db là biến kết nối MySQL của bạn (mysql.createConnection hoặc mysql.createPool)
    db.query(sql, [`${letter}%`], (err, results) => {
        if (err) {
            console.error("Lỗi truy vấn SQL danh sách thuốc theo SKU:", err);
            return res.status(500).json({ error: "Lỗi hệ thống khi tải dữ liệu từ database" });
        }
        res.json(results);
    });
});
app.listen(PORT, () => {
    console.log(`Server đang chạy tại: http://localhost:${PORT}`);
});