# Roomie Finder FE (React Native + Expo)

Roomie Finder FE là ứng dụng mobile giúp người dùng **tìm bạn ở ghép phù hợp**, kết nối với nhau và trao đổi trực tiếp trong cùng một nền tảng.  
Ứng dụng tập trung giải quyết bài toán từ đầu đến cuối: **xem phòng -> đăng bài -> gửi lời mời -> chat realtime -> theo dõi cập nhật**.

---

## 1) Bài toán ứng dụng đang giải quyết

Việc tìm người ở ghép ngoài đời thường gặp nhiều khó khăn:

- Thông tin bị phân tán trên nhiều kênh, khó xác thực và khó so sánh.
- Người dùng khó tìm được người có nhu cầu tương thích về tài chính, lối sống, kỳ vọng ở chung.
- Quá trình trao đổi không liền mạch: xem tin ở nơi này, chat ở nơi khác, không theo dõi được trạng thái.
- Dễ bỏ lỡ các cập nhật quan trọng như lời mời, tin nhắn mới, thay đổi liên quan đến room.

Roomie Finder FE đưa toàn bộ hành trình vào một app thống nhất để rút ngắn thời gian và tăng chất lượng match.

---

## 2) Ứng dụng giúp ích gì cho người dùng?

- **Tiết kiệm thời gian tìm kiếm** vì dữ liệu phòng, bài đăng và kết nối nằm cùng một nơi.
- **Tăng tỉ lệ tìm đúng roommate** nhờ profile, thông tin phòng và luồng gợi ý.
- **Ra quyết định nhanh hơn** vì có chat realtime và trạng thái request rõ ràng.
- **Giảm bỏ sót tương tác** nhờ badge + notification theo sự kiện.
- **Trải nghiệm nhất quán trên di động** cho cả người tìm phòng lẫn người cho thuê/tìm người ở cùng.

---

## 3) Chức năng chính có trong app

### 3.1 Xác thực và phiên đăng nhập
- Đăng ký / đăng nhập.
- Lưu và phục hồi phiên bằng token.
- Tự động điều hướng giữa nhóm route auth và route chính.

### 3.2 Feed bài đăng
- Xem danh sách bài đăng mới nhất.
- Xem bài recommended dựa trên profile + room score.
- Refresh feed và đồng bộ badge liên quan.

### 3.3 Quản lý bài đăng
- Tạo bài đăng mới.
- Chỉnh sửa / xóa bài của chính mình.
- Đính kèm room vào bài đăng.
- Thông báo local khi đăng bài thành công.

### 3.4 Quản lý phòng
- Danh sách phòng.
- Chi tiết phòng (ảnh, giá, diện tích, sức chứa, tiện ích, địa chỉ).
- Tạo / sửa / xóa room cho owner.

### 3.5 Lời mời kết nối (requests)
- Gửi lời mời đến user khác.
- Xem incoming / outgoing requests.
- Accept / reject và xử lý trạng thái sau cập nhật.
- Mở chat trực tiếp khi request được chấp nhận.

### 3.6 Chat realtime
- Chat theo room bằng STOMP/WebSocket.
- Đồng bộ unread/badge theo realtime.
- Hiển thị system message (member joined/kicked, room deleted...).

### 3.7 Notification
- Đồng bộ notification từ backend queue cho badge.
- Local notification trong app cho các sự kiện quan trọng (new message, room invite, member joined, post published).
- Hỗ trợ điều hướng khi người dùng tap notification.

---

## 4) Công nghệ sử dụng

### 4.1 Core framework
- `React Native` + `Expo` (SDK 54)
- `TypeScript` (strict mode)
- `expo-router` cho file-based routing

### 4.2 State & data layer
- `zustand` cho state toàn cục (auth, badge, notification, realtime flags...)
- `axios` cho HTTP client
- Service layer tách biệt gọi API (`services/*`, `apis/*`)

### 4.3 Realtime & messaging
- `@stomp/stompjs` qua WebSocket endpoint `/ws-native`
- Subscribe queue/topic theo từng nghiệp vụ (notification, chat room)
- Debounce + resync badge để giảm race condition

### 4.4 Notification stack
- `expo-notifications` cho local notification
- `expo-device`, `expo-constants` phục vụ runtime context
- Android notification channel (`chat-app`)

### 4.5 UI/UX
- Component tái sử dụng theo domain (`components/chat`, `components/home`, `components/request`, ...)
- i18n qua `locales/*` + hooks
- Dark/light theme qua custom theme context

---

## 5) Cấu trúc thư mục (tham chiếu nhanh)

```text
roomie-finder-fe/
|- app/                     # expo-router routes (màn hình chính)
|  |- (auth)/               # login/register
|  |- (tabs)/               # home/chats/requests/room/profile/map...
|  |- chat/                 # chat room detail
|  |- request/              # request detail/create
|  |- post/                 # post detail
|  \- _layout.tsx           # root layout + auth gate + notification listeners
|
|- components/              # UI components theo feature/domain
|  |- chat/
|  |- home/
|  |- request/
|  |- room/
|  \- ...
|
|- hooks/                   # custom hooks (realtime, fetch, sync state)
|- services/                # nghiệp vụ FE, orchestration, mapping data
|- apis/                    # định nghĩa API calls (axios)
|- stores/                  # Zustand stores
|- contexts/                # theme/i18n providers
|- utils/                   # helpers, formatters, parsers
|- data/                    # request/response types
|- types/                   # shared domain types
|- constants/               # hằng số domain
|- locales/                 # i18n resources
|- assets/                  # ảnh/icon/font...
|- app.json                 # expo config
|- app.config.ts            # runtime config extension
\- package.json             # scripts + dependencies
```

> Lưu ý: cấu trúc có thể thay đổi theo từng phase, nhưng nguyên tắc tách layer `route -> hook -> service -> api` được giữ nhất quán.

---

## 6) Luồng dữ liệu tổng quát

### 6.1 HTTP flow
1. Màn hình gọi hook.
2. Hook gọi `service`.
3. Service gọi `api` (axios).
4. Response được chuẩn hóa về type/domain model.
5. UI cập nhật local state hoặc Zustand store.

### 6.2 Realtime flow
1. App mở socket (notification/chat) sau khi có token.
2. Nhận event realtime (message/request/system events).
3. Cập nhật store (seq counters, unread counts).
4. Trigger refetch/selective sync nếu cần.
5. Trigger local notification ở các event quan trọng.

---

## 7) Quy ước kỹ thuật trong frontend

- Ưu tiên TypeScript strict, tránh `any` nếu không cần thiết.
- Không để logic nghiệp vụ nặng trong screen; đẩy xuống hook/service.
- UI component theo domain để tái sử dụng và dễ maintain.
- Realtime cần có fallback sync từ API để giảm lệch trạng thái.
- Hành vi notification ưu tiên local-side trigger, không phụ thuộc thay đổi backend.

---

## 8) Cài đặt và chạy dự án

### 8.1 Yêu cầu môi trường
- Node.js: `24.13.0`
- npm tương thích theo Node
- Expo CLI (qua `npx expo ...`)

### 8.2 Cài dependencies

```bash
npm install
```

### 8.3 Chạy ứng dụng

```bash
npx expo start
```

Tùy mục đích:
- Android: `npx expo start --android`
- iOS: `npx expo start --ios`
- Web: `npx expo start --web`

### 8.4 Lint

```bash
npm run lint
```

---

## 9) Kiểm thử notification (khuyến nghị)

- Nên test trên **thiết bị thật** để kiểm tra đầy đủ hành vi notification.
- iOS simulator có thể không phản ánh đầy đủ behavior của local notification.
- Kiểm thử các case:
  - New message khi không mở đúng chat hiện tại.
  - Room invite nhận từ realtime event.
  - Member joined trong room đang theo dõi.
  - Post published ngay sau khi tạo post thành công.
  - Tap notification khi app foreground/background/killed.

---

## 10) Giá trị sản phẩm

Roomie Finder FE không chỉ là app listing phòng, mà là một luồng cộng tác hoàn chỉnh cho nhu cầu ở ghép:

- Tìm thông tin nhanh hơn.
- Kết nối đúng người hơn.
- Trao đổi và ra quyết định ngay trong app.
- Theo dõi trạng thái realtime để không bỏ lỡ cơ hội phù hợp.
