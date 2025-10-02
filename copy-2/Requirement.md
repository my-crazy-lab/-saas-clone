# Công cụ Lên lịch & Đặt cuộc họp — Requirement Document

> Phiên bản: 0.1
>
> Tác giả: [Product / PM]
>
> Mục tiêu: tài liệu yêu cầu từ ý tưởng tới delivery cho sản phẩm công cụ lên lịch (scheduling & booking) tương tự Calendly / Zencal.

---

# 1. Tóm tắt dự án

Xây dựng một web app nhẹ cho phép người dùng (cá nhân, chuyên viên sales, đội nội bộ) tạo trang đặt lịch (scheduling page) để khách hàng/đồng nghiệp chọn khung giờ trống. Hệ thống đồng bộ với calendar phổ biến (Google Calendar, Microsoft Outlook/Office 365), hỗ trợ nhiều kiểu sự kiện (1:1, nhóm, nhóm cố định người tham gia), tạo tự động link hội họp (Zoom/Google Meet), gửi nhắc qua email/SMS và quản lý booking trong dashboard.

# 2. Lý do & giá trị kinh doanh

* **Pain:** mất thời gian chốt lịch qua email/tin nhắn, double-booking, sai múi giờ.
* **Giá trị:** rút ngắn quy trình đặt cuộc, giảm nhầm lẫn, tăng conversion cho sales, tiết kiệm thời gian.
* **KPIs thành công:** tỷ lệ conversion booking, lượt dùng trang booking của người dùng, churn khách hàng thấp, ARR/seat.

# 3. Phạm vi MVP

**Bao gồm (MVP):**

* Đồng bộ calendar 1 chiều/2 chiều với Google Calendar và Microsoft Office 365/Outlook (OAuth).
* Tạo "Meeting Types" (1:1, 15/30/60 phút), cấu hình buffer time, availability (working hours), minimum notice, max bookings per day.
* Public scheduling page với timezone detection và responsive UI.
* Auto-creation conference link: Google Meet (via Calendar API) và Zoom (OAuth integration).
* Email reminders và confirmation (SMTP/SendGrid). SMS reminders tùy chọn (Twilio) — basic tier.
* Booking workflow: client chọn slot → điền thông tin cơ bản → nhận email confirmation + calendar invite.
* Dashboard: danh sách booking, cancel/reschedule, settings cho meeting types, connect/disconnect calendar.
* Authentication: email/password + OAuth signup, initial SSO optional for Enterprise.
* Logging & basic analytics: booked meetings per day, no-show rate.

**Không bao gồm (MVP không có):**

* Payment checkout tích hợp (Stripe) — optional for later.
* Scheduling groups phức tạp (round-robin across team members) — can be v1.1.
* Advanced availability optimization (smart scheduling, AI-based suggestions).
* Custom domain / white-label (Enterprise feature later).

# 4. Stakeholders

* Product Manager
* Backend Engineers
* Frontend Engineers / UX
* DevOps / SRE
* QA
* Sales & Customer Success
* Early pilot users (sales teams, consultants)

# 5. User personas & journeys

**Personas:**

* Cá nhân (freelancer): cần 1 trang booking đơn giản.
* Sales rep: đặt cuộc cho lead, cần auto calendar invite và conference link.
* Team lead: xem lịch team (future feature).
* Khách/Lead: dễ dàng chọn slot, nhận nhắc và link họp.

**Mvp journeys:**

1. Người dùng đăng ký → kết nối Google Calendar → tạo Meeting Type "Intro 30m" (múi giờ, buffer, min notice) → chia sẻ link booking.
2. Khách mở link → chọn thời gian → điền tên & email → nhận confirmation + calendar invite với Google Meet link.
3. Người dùng xem dashboard để hủy/đổi time nếu cần.

# 6. Functional Requirements

## 6.1 Calendar Integration

* OAuth 2.0 cho Google Calendar & Microsoft Graph (Office 365/Outlook).
* Đồng bộ 2 chiều: block sự kiện ngoại lai, tạo sự kiện khi booking.
* Permission handling: read-only calendar free/busy + create events.
* Token refresh & reconnect flow.

## 6.2 Meeting Types & Availability

* Meeting Type model: title, duration, location (conference/physical), buffer_before/after, max_per_day, recurring availability windows (Mon-Fri 9-17), custom exceptions (vacation dates), min_notice (e.g., 24h), lead_time.
* Timezone aware: lưu timezone của host; detect timezone khách, show converted times.

## 6.3 Booking Page UX

* Public URL per user or per meeting type (e.g., yourdomain.app/username; yourdomain.app/username/intro-30).
* Calendar visualization with available slots; mobile-friendly.
* Form fields customizable (name, email required; optional notes/phone).
* CAPTCHA to prevent spam.

## 6.4 Conferencing Integration

* Create conference link on event creation: Google Meet (via Calendar insert) and Zoom (create meeting via Zoom API) — store link in event and include in email invite.

## 6.5 Notifications & Reminders

* Confirmation email to host & guest with event details + calendar invite (.ics attachments via Calendar API).
* Reminder schedule configurable (e.g., 24h, 1h before).
* SMS reminders via provider (Twilio) optional per-user setting.

## 6.6 Reschedule & Cancellation

* Allow guests to reschedule/cancel via links in emails (secure tokenized link).
* Update calendar event accordingly and notify host & guest.

## 6.7 Dashboard & Admin

* User dashboard: upcoming meetings, past meetings, quick link to scheduling page, settings, connected calendars.
* Admin panel (internal): manage users, usage metrics, support tools for reconnecting calendars and inspecting event logs.

## 6.8 Billing & Plans (basic)

* Free tier: 1 scheduling page, limited meeting types, email reminders only.
* Pro tier: unlimited meeting types, SMS reminders, Zoom integration, custom branding.
* Enterprise: SSO, SLAs, dedicated support, custom domain (future).

## 6.9 Security & Privacy

* Authentication: OAuth, email/password hashed (bcrypt), optional 2FA for Pro.
* Event data encryption at rest (DB-level) and in transit (TLS).
* Consent checkbox on booking page for data collection.
* Data retention: ability for host to purge history; GDPR compliance guidance.

# 7. Non-functional Requirements

* **Latency:** page load < 300ms for scheduling page (static + API minimal). Event creation < 1s after confirmation.
* **Scalability:** support initial user base 10k users; autoscale background workers.
* **Availability:** 99.9% uptime for scheduling & booking flows.
* **Localization:** support Vietnamese + English; timezone handling robust.

# 8. Architecture & Tech Stack (gợi ý)

* Frontend: React + TypeScript, responsive, TailwindCSS.
* Backend: Node.js (NestJS/Express) hoặc Python (FastAPI) cho API.
* DB: Postgres (users, meeting types, bookings).
* Queue: Redis or RabbitMQ cho email/SMS/reminder jobs.
* Object Storage: S3-compatible (for logs/attachments).
* Auth: OAuth for calendar providers; Auth0/Keycloak optional for SSO.
* Conferencing: Zoom API, Google Calendar conference creation.
* Email: SendGrid, SES; SMS: Twilio.
* Infra: Kubernetes + Terraform, CI/CD pipeline.

# 9. Data Flow (tóm tắt)

1. Host kết nối calendar via OAuth → tokens lưu an toàn.
2. Host cấu hình meeting type → lưu DB.
3. Khách mở trang booking → chọn slot → submit form.
4. Backend kiểm tra free/busy via calendar API → tạo event + conference link → gửi invites + confirmation.
5. Reminders scheduled via background worker.

# 10. Testing & QA

* Unit & integration tests for calendar sync, booking, reschedule flows.
* E2E tests for booking page across browsers/mobile.
* Load test booking page and background reminder jobs.
* Security tests: OAuth flows, token handling, XSS/CSRF.
* Usability testing for booking UX.

# 11. Rollout Plan

* Phase 0 (2 wks): Prototype UI + Google Calendar connect + 1:1 meeting type + basic booking flow.
* Phase 1 (6–8 wks): MVP — Microsoft Calendar, Zoom integration, email reminders, dashboard, mobile responsive.
* Phase 2 (4–6 wks): Billing, SMS reminders, Pro features, improved analytics.
* Phase 3: Enterprise features (SSO, custom domain, SLA).

# 12. Monetization & Pricing gợi ý

* Free: 1 scheduling page, email reminders, Google Meet only.
* Pro (~5–8 USD/user/month): unlimited types, Zoom integration, SMS reminders (pay per SMS), custom branding.
* Business/Enterprise: custom pricing — SSO, dedicated support, higher retention.

# 13. Risks & Mitigation

* **Risk:** OAuth quota limits / API quota exhaustion → Mitigation: exponential backoff, monitoring, request batching.
* **Risk:** Double-booking race conditions → Mitigation: atomic check-and-create with optimistic locking; re-check calendar immediately before create.
* **Risk:** Spam bookings → Mitigation: CAPTCHA, require email confirmation for guest.
* **Risk:** Data privacy / GDPR → Mitigation: consent capture, data deletion workflow, encryption.

# 14. Acceptance Criteria (MVP)

* Người dùng có thể kết nối Google Calendar và nhận booking chính xác (no double-booking) trong 95% thử nghiệm.
* Booking flow (select → confirm) hoạt động trên desktop & mobile.
* Confirmation email + calendar invite gửi thành công 98%.
* Reschedule/cancel link hoạt động và cập nhật calendar.

# 15. Metrics để theo dõi

* Số lượt booking / ngày.
* Tỷ lệ no-show (khi có dữ liệu).
* Tỷ lệ conversion (visitors → booked).
* API error rate (calendar integrations).
* MRR / ARPU, churn rate.

# 16. Roadmap tính năng tương lai

* Group scheduling & round-robin assignment.
* Intelligent availability optimization (AI-assisted suggestions).
* Custom domains & white-label.
* Native mobile apps.
* Payment & paid meetings integration (Stripe).

# 17. Deliverables

* MVP product (Frontend + Backend + Calendar + Zoom + email reminders).
* Technical docs (API spec, OAuth setup, runbook).
* Onboarding guide cho người dùng & team hỗ trợ.

# 18. Tài nguyên ước tính

* Team MVP: 1 PM, 2 backend, 1 frontend, 1 infra, 1 QA, 1 UX (part time).
* Timeline: Prototype 2 wks, MVP 8–10 wks to pilot.

# 19. Next steps

1. Kickoff, xác định target pilot users (sales/consultants).
2. Thiết kế UX cho scheduling page và signup flow.
3. Implement calendar OAuth + atomic booking flow POC.
4. Run pilot, thu feedback, iterate.

---

**Appendix — ví dụ endpoint API (MVP)**

* `POST /api/v1/oauth/connect` — khởi OAuth flow cho Google/Office365/Zoom.
* `POST /api/v1/meeting-types` — tạo Meeting Type.
* `GET /api/v1/scheduling/{username}/{meetingType}` — public booking page data.
* `POST /api/v1/bookings` — tạo booking (server side check + create event).
* `POST /api/v1/bookings/{id}/reschedule` — reschedule.

---

*Phiên bản này là template để bắt đầu — có thể điều chỉnh theo yêu cầu bảo mật, quy mô và chiến lược go-to-market của bạn.*
