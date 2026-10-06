# 🏛️ LinguaVault - Personal English Knowledge & SRS Ecosystem

> **LinguaVault** là hệ sinh thái học tập tiếng Anh cá nhân hóa toàn diện, giải quyết triệt để **đường cong lãng quên (Ebbinghaus Forgetting Curve)** bằng thuật toán **Lặp lại ngắt quãng (Spaced Repetition System / SuperMemo SM-2)** kết hợp cùng **Trợ lý Trí tuệ Nhân tạo (Google Gemini AI)**, **Phát âm Native Siri Apple**, và **Hệ thống Telegram AI Copilot hai chiều**.

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-SQLite3%20(better--sqlite3)-blue.svg)](https://www.sqlite.org/)
[![Frontend Web](https://img.shields.io/badge/Web-React%2019%20%2B%20Vite-61dafb.svg)](https://vitejs.dev/)
[![Mobile App](https://img.shields.io/badge/Mobile-React%20Native%20%2F%20Expo%20SDK52-000020.svg)](https://expo.dev/)
[![Desktop](https://img.shields.io/badge/Desktop-Electron-47848F.svg)](https://www.electronjs.org/)
[![AI Powered](https://img.shields.io/badge/AI-Google%20Gemini%20Flash--Lite-orange.svg)](https://ai.google.dev/)

---

## 📑 Mục Lục
1. [Kiến Trúc Hệ Thống & Monorepo](#-kiến-trúc-hệ-thống)
2. [Các Phân Hệ Tính Năng Nổi Bật](#-các-phân-hệ-tính-năng-nổi-bật)
3. [Cấu Trúc Thư Mục Dự Án](#-cấu-trúc-thư-mục-dự-án)
4. [Hướng Dẫn Khởi Động Nhanh (Quick Start)](#-hướng-dẫn-khởi-động-nhanh)
5. [Cấu Hình & Biến Môi Trường](#-cấu-hình--biến-môi-trường)
6. [Quy Trình Kiểm Thử Tự Động (Test Suite)](#-quy-trình-kiểm-thử-tự-động)
7. [Đóng Gói & Triển Khai Production & iOS IPA](#-đóng-gói--triển-khai-production)

---

## 🏗️ Kiến Trúc Hệ Thống

LinguaVault được thiết kế theo mô hình **Monorepo Hướng Dịch Vụ Cục Bộ (Local-First Architecture)**, toàn bộ dữ liệu thuộc quyền sở hữu riêng tư 100% của người học, lưu trữ tại tệp tin SQLite cục bộ, không phụ thuộc vào đám mây bên thứ ba:

```
+-------------------------------------------------------------------------+
|                  GIAO DIỆN NGƯỜI DÙNG (MULTI-PLATFORM)                   |
|                                                                         |
|   🌐 Web Client (React 19 + Vite)        📱 Mobile App (React Native)    |
|   Port: 3000                            iOS / Android / PWA (Expo)      |
|                                                                         |
|   💻 Desktop App (Electron)              📱 Mobile Simulator (Electron) |
+------------------------------------+------------------------------------+
                                     | (REST API / JSON / JWT Auth)
                                     v
+-------------------------------------------------------------------------+
|                LINGUAVAULT CORE API SERVER (Port: 5001)                 |
|                                                                         |
|  • Modular Express Architecture (Middlewares, Auth, Security, Validates)|
|  • Spaced Repetition Engine (SuperMemo SM-2 Algorithm)                  |
|  • Google Gemini Flash-Lite AI Engine (Response < 3.5s)                 |
|  • Native Audio Engine (Apple AVSpeechSynthesizer + expo-av HD Stream)  |
|  • Telegram AI Copilot & Two-Way Alarm Poller                           |
|  • Hardcore OS-Level Discipline Alarm Service                           |
|  • better-sqlite3 Native Engine with WAL Mode (lingua_vault.db)         |
+------------------------------------+------------------------------------+
                                     |
              +----------------------+----------------------+
              |                                             |
              v                                             v
     Google AI Studio API                         Telegram Bot API
     (Gemini Flash 0đ)                            (Two-way Polling)
```

---

## 🌟 Các Phân Hệ Tính Năng Nổi Bật

### 1. 📖 Kho Từ Vựng & Cấp Độ IELTS Phân Tầng (Vocab Vault)
- **Tra cứu 1-Click Siêu Tốc**: Tự động lấy phiên âm quốc tế (IPA), loại từ, audio phát âm giọng Mỹ/Anh chuẩn, định nghĩa song ngữ và ví dụ mẫu.
- **Phân Tầng IELTS/CEFR 6 Cấp Độ**: Từ A1-A2 (IELTS 4.0) đến C2 Mastery (IELTS 8.5-9.0).
- **Quản lý Chủ đề (Topics)**: Gán tag linh hoạt theo các ngữ cảnh: *Công việc, Công nghệ, Học thuật, Giao tiếp hàng ngày, Y tế, Tài chính...*

### 2. 🧩 Kho Mẫu Câu & Cấu Trúc Ngữ Pháp Chuyên Sâu (Pattern Hub)
- **10 Nhóm Chức Năng Giao Tiếp**: Nhấn mạnh (*Emphasis*), Nhượng bộ (*Concession*), Trình tự thời gian (*Time Sequence*), Điều kiện (*Conditional*), So sánh (*Comparison*), Nguyên nhân - Kết quả (*Cause & Effect*), Mục đích (*Purpose*), Đảo ngữ (*Inversion*), Câu chẻ (*Cleft Sentences*), Thể bị động nâng cao.
- **Phân loại Tone & Sắc Thái**: *Academic, Formal Business, Conversational, Idiomatic*.

### 3. 🧠 Cỗ Máy Ôn Luyện Chống Quên (SuperMemo SM-2 SRS Engine)
- Tính toán chính xác thời điểm vàng cần ôn tập dựa trên hệ số độ dễ (**Ease Factor - EF**), số lần lặp (**Repetition**) và khoảng cách ngày (**Interval**).
- **3 Chế độ tương tác**: 
  1. *Flashcard lật thẻ 3D*
  2. *Điền từ vào ngữ cảnh (Cloze Blank)*
  3. *Luyện phản xạ nghe phát âm (Audio Reflex)*.

### 4. ✨ Trung Tâm Quiz & Sinh Đề Thông Minh Bằng AI (Quiz Center)
- **Sinh đề AI Siêu Tốc (~3.5 giây)**: Sử dụng mô hình `gemini-flash-lite-latest` với tốc độ phản hồi nhanh gấp 3.5 lần.
- **4 Chế độ làm bài**: *Điền chỗ trống, Chọn nghĩa theo ngữ cảnh, Chọn từ theo định nghĩa, Luyện nghe phản xạ*.
- **Xáo Trộn Đáp Án Ngẫu Nhiên (Fisher-Yates)**: Vị trí đáp án đúng phân bổ ngẫu nhiên A, B, C, D.
- **Lưu Kho Lịch Sử Đề & Làm Lại (Re-take)**: Tự động lưu 100% đề thi đã tạo vào cơ sở dữ liệu để làm lại bất kỳ lúc nào với 0s độ trễ.

### 5. 🎙️ Phòng Luyện Nói & Đánh Giá Phát Âm AI (AI Speaking Lab)
- **Shadowing & Đọc thành tiếng (Read-Aloud)**: Chấm điểm phát âm, ngữ điệu, độ trôi chảy và nhận diện chi tiết từng từ phát âm chuẩn/lệch.
- **Phỏng Vấn Q&A IELTS Tương Tác**: AI đưa ra câu hỏi, người học thu âm câu trả lời -> AI chấm điểm theo chuẩn 4 tiêu chí IELTS Speaking (*Fluency, Lexical Resource, Grammatical Accuracy, Pronunciation*) kèm bài mẫu Band 8.5+.

### 6. 🔊 Động Cơ Âm Thanh Gốc Native (Apple Siri & Silent Mode Support)
- Tích hợp **`expo-speech`** (`AVSpeechSynthesizer`) và **`expo-av`** trên ứng dụng di động.
- Hỗ trợ **`playsInSilentModeIOS: true`**: Cho phép phát âm thanh từ vựng ngay cả khi người dùng gạt nút im lặng / rung trên iPhone.

### 7. 🏆 Gamification 16 Cấp Độ & Báo Thức Kỷ Luật Hệ Điều Hành
- Hệ thống 16 Bậc Thang Cấp Độ (*Novice Scholar* ➔ *Ascended Polyglot*).
- **Báo thức Hardcore Alarm**: Kêu liên tục trên loa hệ thống và điện thoại, chỉ tắt khi người học hoàn thành đúng 100% nhiệm vụ trả lời câu hỏi.

---

## 📁 Cấu Trúc Thư Mục Dự Án

```
/Users/daf/Documents/lingua-vault/
├── server/                         # 🚀 BACKEND SERVER (Express + better-sqlite3)
│   ├── src/
│   │   ├── app.js                  # Express App Factory (Middlewares & Route Mounts)
│   │   ├── config.js               # Cấu hình tập trung (JWT, RateLimit, CORS, Port)
│   │   ├── middleware/             # Auth, ErrorHandler, RateLimit, Security, Validate
│   │   ├── controllers/            # Controllers (auth, vocab, pattern, quiz, srs, speaking, alarm...)
│   │   ├── db/                     # Cơ sở dữ liệu SQLite & Seed dữ liệu mẫu
│   │   ├── services/               # SM-2, Gemini AI, Audio TTS, System Alarm, Telegram Bot
│   │   └── index.js                # Điểm khởi động máy chủ (Port 5001)
│   └── package.json
│
├── web/                            # 🌐 WEB CLIENT (React 19 + Vite)
│   ├── src/
│   │   ├── components/             # QuizCenter, VocabHub, PatternHub, Reader, SpeakingLab...
│   │   ├── services/               # API Client kết nối máy chủ
│   │   ├── App.jsx                 # Bộ điều hướng & Layout chính
│   │   └── index.css               # Hệ thống Style Glassmorphism & Dark/Light theme
│   └── package.json
│
├── mobile/                         # 📱 MOBILE APP (React Native + Expo SDK 52)
│   ├── src/services/               # Mobile API Client (Tự động quét CANDIDATE_SERVERS)
│   ├── App.js                      # Ứng dụng di động hợp nhất (Zero-Mount Modals & Native Audio)
│   ├── app.json                    # Cấu hình Expo, Apple ATS & App Icon
│   ├── metro.config.js             # Metro Bundler Config
│   └── package.json
│
├── desktop/                        # 💻 DESKTOP WRAPPER & SIMULATOR (Electron)
│   ├── main.js                     # Cấu hình cửa sổ ứng dụng Desktop
│   ├── mobile-simulator.js         # Cửa sổ mô phỏng iPhone 15 Pro kèm cảm ứng vuốt chạm
│   └── package.json
│
├── .github/workflows/              # ⚙️ CI/CD Pipelines
│   └── build-ios-ipa.yml           # Tự động biên dịch & đóng gói file LinguaVault.ipa
├── run-dev.js                      # Script chạy đồng thời Server + Web
├── README.md                       # Tài liệu hướng dẫn sử dụng & tổng quan
├── ARCHITECTURE.md                 # Đặc tả kỹ thuật & REST API
├── BUSINESS.md                     # Chiến lược kinh doanh & Định vị sản phẩm
└── AGENTS.md                       # Sổ tay quy tắc kỹ thuật dành cho AI Coding Assistant
```

---

## ⚡ Hướng Dẫn Khởi Động Nhanh

### 1. Thông Tin Đăng Nhập Mặc Định
- **Tài khoản**: `admin`
- **Mật khẩu**: `123456`

### 2. Khởi Động Hệ Thống Phát Triển (Full Stack)
Tại thư mục gốc dự án:
```bash
# 1. Khởi động Backend API (Port 5001) & Web Client (Port 3000):
npm run dev:server
npm run dev:web

# Hoặc khởi động nhanh cả 2:
node run-dev.js
```

### 3. Khởi Chạy Bản Mô Phỏng Mobile Trên Desktop (Electron iPhone 15 Pro)
```bash
npm run app:mobile
```
- Cửa sổ iPhone 15 Pro kích thước `414 x 896 px` sẽ xuất hiện trên màn hình máy tính với hỗ trợ cảm ứng vuốt chạm và DevTools (`Option + Command + I`).

### 4. Kiểm Thử Hệ Thống (Master Rigorous Audit)
```bash
node scratch/master_rigorous_audit.mjs
```
*Kết quả chuẩn: Đạt 26/26 bài kiểm tra (100% PASS).*

---

## 📦 Đóng Gói & Cài Đặt File IPA Lên iPhone

Dự án đã tích hợp sẵn GitHub Actions CI/CD để tự động build file `.ipa` cài đặt trực tiếp qua **Sideloadly** hoặc **AltStore**:
1. Đẩy code lên nhánh `main` (`git push origin main`).
2. Truy cập tab **Actions** trên GitHub repository: [GitHub Actions - LinguaVault](https://github.com/tavietdat123/lingua-vault/actions).
3. Tải artifact **`LinguaVault-iOS-IPA`** (file `LinguaVault.ipa`).
4. Kéo thả file `LinguaVault.ipa` vào phần mềm **Sideloadly** trên máy tính để cài đặt vào iPhone của bạn.

---

## 📄 Bản Quyền & Giấy Phép
Dự án được xây dựng và phát triển dưới giấy phép **MIT License**. Mọi quyền riêng tư dữ liệu thuộc về người sử dụng cục bộ.

# lena-s-app
