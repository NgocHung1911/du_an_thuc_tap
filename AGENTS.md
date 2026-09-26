# AGENTS.md

Tài liệu này mô tả cách làm việc với monorepo `du_an_thuc_tap`. Phạm vi gồm hai ứng dụng độc lập: `task_management_system_backend` và `task_management_system_frontend`.

## Project architecture

- **Backend** là ứng dụng Spring Boot REST API, khởi động từ `com.task.management.TaskManagementSystemApplication` và phục vụ mặc định tại `http://localhost:8080`.
- Luồng xử lý chính của backend:
  - `controller` nhận HTTP request và ánh xạ endpoint.
  - `service` xử lý nghiệp vụ, phân quyền theo role hệ thống và role trong project.
  - `repository` truy cập MySQL qua Spring Data JPA/Hibernate.
  - `entity` ánh xạ dữ liệu bền vững; `dto/request`, `dto/response` định nghĩa hợp đồng API.
  - `config` cấu hình Security, JWT, CORS, WebSocket, Cloudinary và Cloudflare R2.
  - `event` và `service/RealtimeEventPublisher` phát sự kiện domain cho cập nhật realtime.
- Backend cung cấp các nhóm chức năng chính: authentication/password OTP/Google OAuth, user management, project và project membership, task, comment/reply, notification, invitation và upload attachment/avatar.
- **Authentication** dùng JWT stateless qua `Authorization: Bearer <token>`. Spring Security bảo vệ mọi endpoint ngoài các endpoint authentication/invitation được mở công khai.
- **Realtime** dùng STOMP over SockJS. Backend dùng `/ws`, application prefix `/app`, broker `/topic` và `/queue`, user destination `/user`. Topic project có kiểm tra JWT và membership.
- **Frontend** là SPA React/Vite. `App.jsx` khai báo public routes và protected routes; `AuthProvider` quản lý JWT/user/roles; `WebSocketProvider` quản lý kết nối STOMP; `MainLayout` phân phối sidebar admin/member và render nested route qua `Outlet`.
- Frontend gọi REST API qua `src/services/apiClient.ts` với base URL mặc định `http://localhost:8080/api`, tự gắn Bearer token và xử lý 401 bằng cách xóa session rồi chuyển về `/login`.
- Dữ liệu realtime được dùng để cập nhật task, project member, comment, notification và avatar; sau các sự kiện quan trọng frontend có thể refresh dữ liệu REST để đồng bộ.
- Backend hiện dùng `spring.jpa.hibernate.ddl-auto: update`; các SQL trong `src/main/resources` là script hỗ trợ thủ công cho bảng quan hệ/attachment khi cần.

## Tech stack

### Backend

- Java 21.
- Spring Boot 4.1.0.
- Spring MVC, Spring Data JPA, Hibernate, Spring Validation.
- Spring Security, BCrypt và JJWT 0.12.6.
- Spring WebSocket/STOMP và SockJS.
- MySQL runtime; H2 cho test.
- Lombok.
- Google API Client cho Google login.
- AWS SDK S3 API cho Cloudflare R2.
- Cloudinary HTTP client cho image/avatar storage.
- Brevo REST API qua `RestTemplate` cho OTP và invitation email.
- JUnit 5, Mockito, Spring Boot Test và Spring Security Test.

### Frontend

- React 19 với React DOM và JSX/TSX.
- Vite 8 và `@vitejs/plugin-react`.
- JavaScript/TypeScript; TypeScript compiler chạy ở chế độ bundler, `strict` hiện tắt.
- React Router DOM 7.
- Axios cho REST API.
- `@stomp/stompjs` và `sockjs-client` cho realtime.
- Tailwind CSS 4 qua `@tailwindcss/vite`.
- Lucide React cho icons.
- i18next, react-i18next và browser language detector; locales hiện có `vi` và `en`.
- ESLint 10 với React Hooks và React Refresh rules.

## Coding rules

- Giữ thay đổi nhỏ, tập trung đúng module và tôn trọng kiến trúc hiện có. Không refactor diện rộng nếu task không yêu cầu.
- Backend:
  - Giữ phân lớp controller/service/repository/entity/DTO; nghiệp vụ không đặt trong controller.
  - Dùng DTO cho API response/request, không expose entity trực tiếp khi có DTO tương ứng.
  - Dùng `@Transactional` phù hợp; các truy vấn đọc nên dùng `readOnly = true` khi đang theo pattern hiện tại.
  - Dùng enum hiện có cho role, project status, task status, priority, notification và invitation status; không tạo chuỗi trạng thái tùy ý.
  - Kiểm tra quyền ở service: system `ADMIN` và project role `OWNER`/`ADMIN`/`MEMBER` có quyền khác nhau. Luôn kiểm tra user/assignee/reporter thuộc project trước khi gán.
  - Dùng `ResourceNotFoundException` cho tài nguyên không tồn tại và `BadRequestException` cho request/nghiệp vụ không hợp lệ; giữ xử lý tập trung qua `GlobalExceptionHandler`.
  - Khi thay đổi dữ liệu task/project/member/comment/notification có tác động realtime, giữ event WebSocket và notification tương ứng.
  - Dùng Lombok và style Java hiện có; không thêm comment chỉ để mô tả code hiển nhiên.
- Frontend:
  - Tách API calls vào `src/services`, state dùng chung vào `context`, reusable UI vào `components`, màn hình theo domain vào `pages`.
  - Dùng `apiClient` thay vì tạo Axios client riêng; giữ interceptor Bearer token, multipart handling và 401 logout.
  - Dùng type/interface và union type hiện có cho DTO/status/priority khi sửa file TypeScript.
  - Giữ route protection qua `ProtectedRoutes.tsx`; không chỉ ẩn UI để thay thế kiểm tra quyền backend.
  - Dùng `useWebSocket`, `useProjectWebSocket` hoặc `useNotificationWebSocket` cho subscription và luôn unsubscribe khi unmount.
  - Text hiển thị cho người dùng nên đi qua i18next và cập nhật cả `src/locales/vi.json` và `src/locales/en.json` khi thêm key.
  - Dùng Lucide React cho icon và giữ style Tailwind hiện có; tránh thêm thư viện UI mới nếu không cần.
- Quy tắc xác minh tối thiểu sau thay đổi:
  - Backend: chạy `./mvnw test` trên macOS/Linux hoặc `./mvnw.cmd test` trên Windows từ thư mục backend.
  - Frontend: chạy `npm run lint` và `npm run build` từ thư mục frontend.
  - Nếu thay đổi auth, permission, WebSocket, upload hoặc API contract, ưu tiên chạy test liên quan và kiểm tra cả hai ứng dụng.

## Folder structure

```text
AGENTS.md

task_management_system_backend/
  pom.xml                         # Maven dependencies, Java 21, test setup
  mvnw, mvnw.cmd                   # Maven Wrapper
  src/main/java/com/task/management/
    config/                        # Security, WebSocket, storage configuration
    config/security/               # JWT filter/provider and WebSocket auth
    controller/                    # REST controllers
    dto/request/                   # Incoming API payloads
    dto/response/                  # Outgoing API payloads
    dto/websocket/                 # Realtime event contract
    entity/                        # JPA entities
    enums/                         # Domain enums
    event/                         # Domain events
    exception/                     # Domain exceptions and global handler
    repository/                    # Spring Data repositories
    service/                       # Business logic and integrations
  src/main/resources/
    application.yml                # Runtime configuration; contains environment-backed secrets
    application-example.yml        # Example configuration
    schema-*.sql                   # Manual schema helper scripts
  src/test/java/                   # Unit, repository, controller, integration tests


task_management_system_frontend/
  package.json                     # npm scripts and dependencies
  vite.config.js                   # Vite and Tailwind plugin setup
  tsconfig.json                    # TypeScript compiler settings
  src/
    App.jsx                        # Root providers and route map
    main.jsx                       # React entry point
    index.css, App.css              # Global styles and legacy template styles
    i18n.ts                         # i18next initialization
    assets/                         # Static frontend assets
    components/
      admin/                        # Admin-specific modals/components
      common/                       # Shared UI components
      layout/                       # Public/main layouts and navigation
      project/                      # Project, task, comment and member UI
    context/                        # Auth and WebSocket providers
    hooks/                          # Reusable React hooks
    locales/                        # Vietnamese and English translations
    pages/
      admin/                        # Admin dashboards and management screens
      auth/                         # Login, register, OTP, invitation screens
      member/                       # Member dashboards, tasks, projects, profile
      project/                      # Project detail screen
      public/                       # Public landing page
    routes/                         # Protected route handling
    services/                       # REST API clients and WebSocket service
  public/                           # Public static assets
```

## Important constraints

- **Never commit secrets.** The current local `application.yml` contains database credentials and third-party keys. Treat them as compromised configuration: move them to environment variables/secrets management, do not copy them into new files, logs, tests or documentation, and rotate them before production use.
- Keep JWT signing secret, Google client configuration, Brevo credentials, Cloudinary credentials and Cloudflare R2 credentials outside source control. Do not rely on development fallback values in production.
- The backend currently allows broad CORS origin patterns and WebSocket origin patterns. Preserve compatibility only when needed; tighten them to known frontend origins before deployment.
- Upload limits are currently 10 MB per file/request. Preserve validation and do not bypass content-type/size checks when adding upload features.
- Invitation tokens expire after 48 hours. OTP flow is time-sensitive; do not expose OTP values in production logs or error responses.
- Do not weaken authorization to make a frontend action work. Backend must remain the source of truth for system role and project membership; WebSocket project subscriptions must also enforce membership.
- Preserve API paths and payload names consumed by frontend services, including `/api`, task/project/member endpoints, `/api/invitations/*`, `/ws`, and the WebSocket event types.
- Task statuses are `TODO`, `DOING`, `REVIEW`, `DONE`; priorities are `LOW`, `MEDIUM`, `HIGH`. Project statuses are `PLANNING`, `IN_PROGRESS`, `COMPLETED`, `ON_HOLD`.
- File storage is split by content: Cloudinary is used for images/avatar-related uploads and Cloudflare R2 for general attachments. Keep URLs and attachment DTO mappings compatible with the frontend.
- `ddl-auto: update` is convenient for development but is not a production migration strategy. Review schema impact and provide an explicit migration/script for structural changes.
- There is no dedicated frontend test script in `package.json`; frontend changes must at minimum pass ESLint and Vite production build, with manual browser verification for route/auth/WebSocket/upload changes.
- Do not edit generated/build output under `target/` or dependency directories such as `node_modules/`; update source/configuration instead.
- Preserve both Vietnamese and English localization and avoid introducing user-visible hardcoded text when an existing translation namespace can be extended.
## Agent Behavior

- Do not start implementing immediately.
- First inspect only the files relevant to the task.
- Before modifying code, briefly identify:
  1. Root cause
  2. Files that need changes
  3. Proposed solution

- Do not modify unrelated files.
- Do not create new files unless necessary.
- Do not install new dependencies unless explicitly required.
- Do not change the database schema unless explicitly requested.
- Do not rewrite working code just for style improvements.
- If the requested behavior already exists, explain why instead of duplicating it.
- After implementation, report:
  1. Files changed
  2. What was changed
  3. How it was verified
  4. Any remaining issues

### Scope Control

For small bugs or features:
- Inspect the smallest relevant scope first.
- Do not recursively inspect the entire repository.
- Expand the scope only when the initial files are insufficient to solve the problem.