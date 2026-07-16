// import http from 'k6/http';
// import { sleep, check } from 'k6';

// export const options = {
//     vus: 10,          // Giả lập 10 người dùng đồng thời
//     duration: '10s',  // Chạy phá thử trong 10 giây
// };

// export default function () {
//     // 1. Tạo dữ liệu SAI (Mật khẩu quá ngắn hoặc sai tài khoản)
//     const payload = JSON.stringify({
//         email: 'user_nhapsai@gmail.com',
//         password: '123', // Mật khẩu sai/không đủ độ dài tiêu chuẩn
//     });

//     const params = {
//         headers: {
//             'Content-Type': 'application/json',
//         },
//     };

//     const res = http.post('http://localhost:3000/api/auth/login', payload, params);

//     // 3. KIỂM TRA (CHECK): Kỳ vọng Server phải trả về mã lỗi 400 hoặc 401 chứ KHÔNG ĐƯỢC trả về 200 OK
//     check(res, {
//         'Hệ thống từ chối thành công (Mã trả về là 400 hoặc 401)': (r) => r.status === 400 || r.status === 401,
//     });

//     sleep(1);
// }
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
    vus: 5,           // Giả lập 5 người dùng phá cùng lúc
    duration: '10s',  // Chạy thử trong 10 giây
};

export default function () {
    // 1. Cố tình gửi data thiếu thông tin (chỉ gửi mỗi "quantity", thiếu "name", "price")
    const payload = JSON.stringify({
        quantity: 100
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // 2. Gửi request POST tạo mới thuốc
    const res = http.post('http://localhost:3000/api/medicines', payload, params);

    // 3. Kiểm tra xem Server có bắt được lỗi nhập thiếu này không
    // Kỳ vọng Server phải trả về mã 400 (Bad Request)
    check(res, {
        'Server bắt lỗi nhập thiếu thành công (Mã 400)': (r) => r.status === 400,
    });

    sleep(1);
}