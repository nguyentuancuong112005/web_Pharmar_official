const bcrypt = require('bcrypt');

const passwordThuong = '123456';

bcrypt.hash(passwordThuong, 10, (err, hash) => {
    if (err) {
        console.error("Lỗi mã hóa:", err);
        return;
    }
    console.log("--------------------------------------------------");
    console.log("CHUỖI HASH CHUẨN TRÊN MÁY BẠN LÀ:");
    console.log(hash);
    console.log("--------------------------------------------------");
});