import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    stages: [
        { duration: '15s', target: 30 },
        { duration: '20s', target: 30 },
        { duration: '5s', target: 0 },
    ],
};

export default function () {
    http.get('http://localhost:3000//api/dashboard/expired-total');

    sleep(1); // Mỗi người dùng gọi API xong sẽ nghỉ 1 giây rồi mới lặp lại
}