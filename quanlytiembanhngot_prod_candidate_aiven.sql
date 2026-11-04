-- PRODUCTION CANDIDATE - REVIEW REQUIRED; NOT EXECUTED
-- Derived from quanlytiembanhngot_clean.sql; source file is unchanged.
-- Data retained: approved role/account/customer/employee/catalog/inventory/supplier
-- seeds and purchase orders PN001-PN003 with their line items.
-- Data omitted: custom_orders, orders, order_items, payments,
-- payment_transaction_attempts and other test fixtures; customer01 below is temporary.
-- Schema retained for those operational tables.
-- No Flyway history is created here. Schema presence is not proof that a
-- Flyway migration ran. Apply only after a separately reviewed Flyway plan.
-- Five temporary test accounts use independently salted BCrypt hashes; no plaintext password is stored.
-- customer01 is linked to customer ID 7 and marked verified for test login.
-- Remove these temporary test accounts/customer fixture before production.
-- Confirmed business rule: every purchase order requires its creating employee.
-- employee_id is NOT NULL and references employees.id via a named FK below.
-- Original source: quanlytiembanhngot.sql
-- Purpose: retain core catalog, staff, roles, suppliers and inventory seed data.
-- Omitted customer order/payment history and test transaction rows:
--   custom_orders, orders, order_items, payments, payment_transaction_attempts
-- Prior test fixtures were removed; this candidate adds temporary customer01/account ID 5 and customer ID 7.
-- Retained customer ID 6 (POS walk-in customer).
-- Table structures, indexes, AUTO_INCREMENT definitions and all other seed data are preserved.
-- IMPORTANT: This file does NOT create Flyway schema history and does NOT run Flyway migrations.
--
-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Nov 03, 2026 at 06:09 AM
-- Server version: 8.4.3
-- PHP Version: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `quanlytiembanhngot`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounts`
--

CREATE TABLE `accounts` (
  `id` bigint NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `email_verification_token_expires_at` datetime(6) DEFAULT NULL,
  `email_verification_token_hash` varchar(64) DEFAULT NULL,
  `email_verified` bit(1) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `customer_id` bigint DEFAULT NULL,
  `role_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `accounts`
--

INSERT INTO accounts (id, created_at, email, email_verification_token_expires_at, email_verification_token_hash, email_verified, password_hash, status, updated_at, username, customer_id, role_id) VALUES
(1, NOW(), 'admin.seed@example.invalid', NULL, NULL, b'0', '$2a$10$eozmlHE3s35wi/SQCctKgu.EVrHrx.Pj7jg629j1ehpRvb2RikIXC', 'ACTIVE', NOW(), 'admin', NULL, 1),
(2, NOW(), 'manager.seed@example.invalid', NULL, NULL, b'0', '$2a$10$r5G62dXT1SDGun12KfNCgee37zzgKlB4SwQUOPefI0OGlISF2hgB6', 'ACTIVE', NOW(), 'manager', NULL, 2),
(3, NOW(), 'staff01.seed@example.invalid', NULL, NULL, b'0', '$2a$10$6KvNkGr/w8r4uRbrwiXCzexDQ6cFgFlCn.hHg/fYOPyPgXiXJSNei', 'ACTIVE', NOW(), 'staff01', NULL, 3),
(4, NOW(), 'staff02.seed@example.invalid', NULL, NULL, b'0', '$2a$10$.9QBQXLyqEqx2t/5KqKcReL2IE.zZBTXj4EEzEjDGBXz5Flj4gYVy', 'ACTIVE', NOW(), 'staff02', NULL, 3),
(5, NOW(), 'customer01.seed@example.invalid', NULL, NULL, b'1', '$2a$10$/J8bXZS8Lsj7RbTe7bjdVegz6VsC1E7mX4OnoIup4SrtNC.Xhk4iC', 'ACTIVE', NOW(), 'customer01', 7, 4);


-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` bigint NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `status` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `description`, `name`, `status`) VALUES
(1, 'Bánh sinh nhật và bánh kem trang trí', 'Bánh kem', b'1'),
(2, 'Các loại bánh mì dùng hằng ngày', 'Bánh mì', b'1'),
(3, 'Bánh ngọt và bánh dùng kèm trà cà phê', 'Bánh ngọt', b'1'),
(4, 'Các loại bánh quy đóng hộp', 'Bánh quy', b'1'),
(5, 'Các loại bánh mousse nhiều hương vị', 'Bánh mousse', b'1');

-- --------------------------------------------------------

--
-- Table structure for table `contact_messages`
--

CREATE TABLE `contact_messages` (
  `id` bigint NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `customer_email` varchar(100) NOT NULL,
  `message` varchar(3000) NOT NULL,
  `customer_name` varchar(100) NOT NULL,
  `status` enum('IN_PROGRESS','NEW','RESOLVED') NOT NULL,
  `subject` varchar(120) NOT NULL,
  `customer_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` bigint NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `loyalty_points` int DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `status` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `address`, `email`, `full_name`, `loyalty_points`, `phone`, `status`) VALUES
(1, 'Quận 1, TP.HCM', 'minhanh@gmail.com', 'Nguyễn Minh Anh', 120, '0911111111', b'1'),
(2, 'Quận 3, TP.HCM', 'quocbao@gmail.com', 'Trần Quốc Bảo', 80, '0922222222', b'1'),
(3, 'Quận 10, TP.HCM', 'ngochan@gmail.com', 'Lê Ngọc Hân', 250, '0933333333', b'1'),
(4, 'Thủ Đức, TP.HCM', 'giahuy@gmail.com', 'Phạm Gia Huy', 40, '0944444444', b'1'),
(5, 'Quận 7, TP.HCM', 'thutrang@gmail.com', 'Hoàng Thu Trang', 0, '0955555555', b'1'),
(6, NULL, 'pos.walkin@example.invalid', 'Khách vãng lai', 0, NULL, b'1'),
(7, NULL, 'customer01.seed@example.invalid', 'Khách hàng kiểm thử', 0, NULL, b'1');


-- --------------------------------------------------------

--
-- Table structure for table `custom_orders`
--

CREATE TABLE `custom_orders` (
  `id` bigint NOT NULL,
  `cake_name` varchar(150) DEFAULT NULL,
  `delivery_date` datetime(6) DEFAULT NULL,
  `deposit` decimal(15,2) DEFAULT NULL,
  `estimated_price` decimal(15,2) DEFAULT NULL,
  `order_date` datetime(6) DEFAULT NULL,
  `request_description` text,
  `status` varchar(30) DEFAULT NULL,
  `customer_id` bigint DEFAULT NULL,
  `employee_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `custom_orders`
--

-- Data intentionally omitted from `custom_orders` during production clean-up.


-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` bigint NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `salary` decimal(15,2) DEFAULT NULL,
  `status` bit(1) DEFAULT NULL,
  `account_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `email`, `full_name`, `phone`, `salary`, `status`, `account_id`) VALUES
(1, 'an@tiembanh.com', 'Nguyễn Văn An', '0901000001', 18000000.00, b'1', 1),
(2, 'binh@tiembanh.com', 'Trần Thị Bình', '0901000002', 14000000.00, b'1', 2),
(3, 'cuong@tiembanh.com', 'Lê Văn Cường', '0901000003', 9000000.00, b'1', 3),
(4, 'dung@tiembanh.com', 'Phạm Thị Dung', '0901000004', 9000000.00, b'1', 4);


-- --------------------------------------------------------

--
-- Table structure for table `ingredients`
--

CREATE TABLE `ingredients` (
  `id` bigint NOT NULL,
  `ingredient_code` varchar(30) DEFAULT NULL,
  `min_stock_level` decimal(15,3) DEFAULT NULL,
  `name` varchar(150) DEFAULT NULL,
  `status` bit(1) DEFAULT NULL,
  `stock_quantity` decimal(15,3) DEFAULT NULL,
  `unit` varchar(30) DEFAULT NULL,
  `unit_price` decimal(15,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `ingredients`
--

INSERT INTO `ingredients` (`id`, `ingredient_code`, `min_stock_level`, `name`, `status`, `stock_quantity`, `unit`, `unit_price`) VALUES
(1, 'NL001', 10.000, 'Bột mì', b'1', 50.000, 'kg', 18000.00),
(2, 'NL002', 8.000, 'Đường', b'1', 35.000, 'kg', 22000.00),
(3, 'NL003', 50.000, 'Trứng gà', b'1', 300.000, 'quả', 3500.00),
(4, 'NL004', 5.000, 'Bơ lạt', b'1', 20.000, 'kg', 160000.00),
(5, 'NL005', 8.000, 'Sữa tươi', b'1', 30.000, 'lít', 32000.00),
(6, 'NL006', 3.000, 'Chocolate', b'1', 15.000, 'kg', 220000.00),
(7, 'NL007', 3.000, 'Dâu tây', b'1', 12.000, 'kg', 90000.00),
(8, 'NL008', 2.000, 'Xoài', b'1', 10.000, 'kg', 55000.00),
(9, 'NL009', 2.000, 'Phô mai', b'1', 10.000, 'kg', 180000.00),
(10, 'NL010', 1.000, 'Men bánh mì', b'1', 5.000, 'kg', 120000.00);

-- --------------------------------------------------------

--
-- Table structure for table `newsletter_subscriptions`
--

CREATE TABLE `newsletter_subscriptions` (
  `id` bigint NOT NULL,
  `active` bit(1) NOT NULL,
  `consented_at` datetime(6) NOT NULL,
  `email` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` bigint NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `customer_request_key` varchar(36) DEFAULT NULL,
  `delivery_address` varchar(255) DEFAULT NULL,
  `delivery_status` varchar(30) DEFAULT NULL,
  `discount_amount` decimal(15,2) DEFAULT NULL,
  `note` varchar(500) DEFAULT NULL,
  `order_code` varchar(30) DEFAULT NULL,
  `order_date` datetime(6) DEFAULT NULL,
  `promotion_code_snapshot` varchar(30) DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  `stock_reserved` bit(1) NOT NULL,
  `total_amount` decimal(15,2) DEFAULT NULL,
  `customer_id` bigint DEFAULT NULL,
  `employee_id` bigint DEFAULT NULL,
  `promotion_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `orders`
--

-- Data intentionally omitted from `orders` during production clean-up.


-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` bigint NOT NULL,
  `discount_amount` decimal(15,2) DEFAULT NULL,
  `line_total` decimal(15,2) DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `unit_price` decimal(15,2) DEFAULT NULL,
  `order_id` bigint DEFAULT NULL,
  `product_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `order_items`
--

-- Data intentionally omitted from `order_items` during production clean-up.


-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` bigint NOT NULL,
  `amount` decimal(15,2) DEFAULT NULL,
  `paid_at` datetime(6) DEFAULT NULL,
  `payment_method` varchar(30) DEFAULT NULL,
  `provider` varchar(100) DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  `transaction_id` varchar(150) DEFAULT NULL,
  `order_id` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `payments`
--

-- Data intentionally omitted from `payments` during production clean-up.


-- --------------------------------------------------------

--
-- Table structure for table `payment_transaction_attempts`
--

CREATE TABLE `payment_transaction_attempts` (
  `id` bigint NOT NULL,
  `amount_vnd` bigint NOT NULL,
  `bank_code` varchar(20) DEFAULT NULL,
  `completed_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `provider_transaction_no` varchar(100) DEFAULT NULL,
  `response_code` varchar(10) DEFAULT NULL,
  `status` varchar(30) NOT NULL,
  `transaction_date` varchar(14) DEFAULT NULL,
  `transaction_status` varchar(10) DEFAULT NULL,
  `txn_ref` varchar(100) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `payment_id` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `payment_transaction_attempts`
--

-- Data intentionally omitted from `payment_transaction_attempts` during production clean-up.


-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` bigint NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` text,
  `expiry_date` date DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `name` varchar(150) DEFAULT NULL,
  `price` decimal(15,2) DEFAULT NULL,
  `product_code` varchar(30) DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `status` bit(1) DEFAULT NULL,
  `unit` varchar(30) DEFAULT NULL,
  `category_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `created_at`, `description`, `expiry_date`, `image_url`, `name`, `price`, `product_code`, `quantity`, `status`, `unit`, `category_id`) VALUES
(1, '2026-11-03 02:47:18.000000', 'Bánh kem dâu tây size 20cm', '2026-12-03', '/images/products/banh-kem-dau.jpg', 'Bánh kem dâu tây', 350000.00, 'BK001', 10, b'1', 'cái', 1),
(2, '2026-11-03 02:47:18.000000', 'Bánh kem chocolate size 20cm', '2026-12-03', '/images/products/banh-kem-chocolate.jpg', 'Bánh kem chocolate', 380000.00, 'BK002', 7, b'1', 'cái', 1),
(3, '2026-11-03 02:47:18.000000', 'Bánh mì bơ tỏi nướng giòn', '2026-11-10', '/images/products/banh-mi-bo-toi.jpg', 'Bánh mì bơ tỏi', 45000.00, 'BM001', 28, b'1', 'cái', 2),
(4, '2026-11-03 02:47:18.000000', 'Bánh mì xúc xích phô mai', '2026-11-10', '/images/products/banh-mi-xuc-xich.jpg', 'Bánh mì xúc xích', 40000.00, 'BM002', 25, b'1', 'cái', 2),
(5, '2026-11-03 02:47:18.000000', 'Bánh croissant nhân bơ truyền thống', '2026-11-13', '/images/products/croissant.jpg', 'Croissant bơ', 35000.00, 'BN001', 20, b'1', 'cái', 3),
(6, '2026-11-03 02:47:18.000000', 'Tiramisu vị cà phê truyền thống', '2026-11-13', '/images/products/tiramisu.jpg', 'Tiramisu', 65000.00, 'BN002', 15, b'1', 'hộp', 3),
(7, '2026-11-03 02:47:18.000000', 'Bánh su kem nhân vanilla', '2026-11-10', '/images/products/su-kem.jpg', 'Bánh su kem', 30000.00, 'BN003', 25, b'1', 'hộp', 3),
(8, '2026-11-03 02:47:18.000000', 'Bánh quy chocolate chip', '2027-01-02', '/images/products/quy-chocolate.jpg', 'Bánh quy chocolate', 55000.00, 'BQ001', 18, b'1', 'hộp', 4),
(9, '2026-11-03 02:47:18.000000', 'Bánh quy bơ hộp 200g', '2027-01-02', '/images/products/quy-bo.jpg', 'Bánh quy bơ', 50000.00, 'BQ002', 20, b'1', 'hộp', 4),
(10, '2026-11-03 02:47:18.000000', 'Bánh mousse xoài tươi', '2026-11-13', '/images/products/mousse-xoai.jpg', 'Mousse xoài', 75000.00, 'BMU001', 12, b'1', 'hộp', 5);

-- --------------------------------------------------------

--
-- Table structure for table `promotions`
--

CREATE TABLE `promotions` (
  `id` bigint NOT NULL,
  `discount_percent` decimal(5,2) DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `max_discount` decimal(15,2) DEFAULT NULL,
  `min_order_value` decimal(15,2) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `promotion_code` varchar(30) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `status` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `promotions`
--

INSERT INTO `promotions` (`id`, `discount_percent`, `end_date`, `max_discount`, `min_order_value`, `name`, `promotion_code`, `start_date`, `status`) VALUES
(1, 10.00, '2026-12-03', 50000.00, 200000.00, 'Ưu đãi khách hàng mới', 'KM001', '2026-11-02', b'1'),
(2, 15.00, '2026-12-03', 100000.00, 300000.00, 'Khuyến mãi bánh kem', 'KM002', '2026-11-03', b'1'),
(3, 5.00, '2026-12-03', 50000.00, 150000.00, 'Mua bánh nhận ưu đãi', 'KM003', '2026-11-03', b'1'),
(4, 20.00, '2026-12-03', 80000.00, 250000.00, 'Khuyến mãi cuối tuần', 'KM004', '2026-11-03', b'1');

-- --------------------------------------------------------

--
-- Table structure for table `promotion_products`
--

CREATE TABLE `promotion_products` (
  `product_id` bigint NOT NULL,
  `promotion_id` bigint NOT NULL,
  PRIMARY KEY (`product_id`, `promotion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `promotion_products`
--

INSERT INTO `promotion_products` (`product_id`, `promotion_id`) VALUES
(1, 1),
(1, 2),
(1, 4),
(2, 2),
(2, 4),
(3, 1),
(5, 1),
(5, 3),
(6, 3),
(6, 4),
(7, 3),
(8, 3),
(10, 2);

-- --------------------------------------------------------

--
-- Table structure for table `purchase_orders`
--

CREATE TABLE `purchase_orders` (
  `id` bigint NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `employee_id` bigint NOT NULL,
  `order_date` datetime(6) DEFAULT NULL,
  `purchase_code` varchar(30) DEFAULT NULL,
  `status` varchar(30) DEFAULT NULL,
  `total_amount` decimal(15,2) DEFAULT NULL,
  `supplier_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `purchase_orders`
--

INSERT INTO `purchase_orders` (`id`, `created_at`, `employee_id`, `order_date`, `purchase_code`, `status`, `total_amount`, `supplier_id`) VALUES
(1, '2026-09-20 08:30:00.000000', 2, '2026-09-20 08:30:00.000000', 'PN001', 'RECEIVED', 2880000.00, 1),
(2, '2026-09-22 09:00:00.000000', 2, '2026-09-22 09:00:00.000000', 'PN002', 'RECEIVED', 2340000.00, 2),
(3, '2026-09-25 10:00:00.000000', 3, '2026-09-25 10:00:00.000000', 'PN003', 'PENDING', 1900000.00, 3);

-- --------------------------------------------------------

--
-- Table structure for table `purchase_order_items`
--

CREATE TABLE `purchase_order_items` (
  `id` bigint NOT NULL,
  `line_total` decimal(15,2) DEFAULT NULL,
  `quantity` decimal(15,3) DEFAULT NULL,
  `unit_cost` decimal(15,2) DEFAULT NULL,
  `ingredient_id` bigint DEFAULT NULL,
  `purchase_order_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `purchase_order_items`
--

INSERT INTO `purchase_order_items` (`id`, `line_total`, `quantity`, `unit_cost`, `ingredient_id`, `purchase_order_id`) VALUES
(1, 1800000.00, 100.000, 18000.00, 1, 1),
(2, 660000.00, 30.000, 22000.00, 2, 1),
(3, 420000.00, 120.000, 3500.00, 3, 1),
(4, 1600000.00, 10.000, 160000.00, 4, 2),
(5, 640000.00, 20.000, 32000.00, 5, 2),
(6, 1100000.00, 5.000, 220000.00, 6, 2),
(7, 900000.00, 10.000, 90000.00, 7, 3),
(8, 550000.00, 10.000, 55000.00, 8, 3),
(9, 450000.00, 2.500, 180000.00, 9, 3);

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` bigint NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `role_code` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `description`, `name`, `role_code`) VALUES
(1, 'Quản lý toàn bộ hệ thống', 'Quản trị viên', 'ADMIN'),
(2, 'Quản lý hoạt động cửa hàng', 'Quản lý', 'MANAGER'),
(3, 'Tiếp nhận và xử lý đơn hàng', 'Nhân viên bán hàng', 'STAFF'),
(4, 'Tài khoản khách hàng của cửa hàng', 'Khách hàng', 'CUSTOMER');

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` bigint NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `name` varchar(150) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `status` bit(1) DEFAULT NULL,
  `supplier_code` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`id`, `address`, `email`, `name`, `phone`, `status`, `supplier_code`) VALUES
(1, 'Quận 5, TP.HCM', 'abc@gmail.com', 'Công ty Nguyên Liệu ABC', '0281111111', b'1', 'NCC001'),
(2, 'Quận 6, TP.HCM', 'minhphat@gmail.com', 'Công ty Thực Phẩm Minh Phát', '0282222222', b'1', 'NCC002'),
(3, 'Quận 11, TP.HCM', 'bepviet@gmail.com', 'Nhà cung cấp Bếp Việt', '0283333333', b'1', 'NCC003');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounts`
--


--
-- Indexes for table `categories`
--


--
-- Indexes for table `contact_messages`
--


--
-- Indexes for table `customers`
--


--
-- Indexes for table `custom_orders`
--


--
-- Indexes for table `employees`
--


--
-- Indexes for table `ingredients`
--


--
-- Indexes for table `newsletter_subscriptions`
--


--
-- Indexes for table `orders`
--


--
-- Indexes for table `order_items`
--


--
-- Indexes for table `payments`
--


--
-- Indexes for table `payment_transaction_attempts`
--
ALTER TABLE `payment_transaction_attempts`
  ADD KEY `ix_payment_transaction_attempts_payment_id` (`payment_id`);

--
-- Indexes for table `products`
--


--
-- Indexes for table `promotions`
--


--
-- Indexes for table `promotion_products`
--


--
-- Indexes for table `purchase_orders`
--


--
-- Indexes for table `purchase_order_items`
--


--
-- Indexes for table `roles`
--


--
-- Indexes for table `suppliers`
--


--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accounts`
--
ALTER TABLE `accounts`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `contact_messages`
--
ALTER TABLE `contact_messages`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `custom_orders`
--
ALTER TABLE `custom_orders`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `ingredients`
--
ALTER TABLE `ingredients`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `newsletter_subscriptions`
--
ALTER TABLE `newsletter_subscriptions`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `payment_transaction_attempts`
--
ALTER TABLE `payment_transaction_attempts`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `promotions`
--
ALTER TABLE `promotions`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

-- Constraints reconciled from Entity mappings and versioned migrations.
-- FK names/actions are stated only where a name/action exists in source;
-- all other FK constraints are intentionally unnamed and use MySQL defaults.

ALTER TABLE accounts
  ADD UNIQUE KEY (username),
  ADD CONSTRAINT uk_accounts_email UNIQUE (email),
  ADD CONSTRAINT uk_accounts_email_verification_token_hash UNIQUE (email_verification_token_hash),
  ADD INDEX ix_accounts_customer_id (customer_id),
  ADD FOREIGN KEY (role_id) REFERENCES roles (id),
  ADD CONSTRAINT fk_accounts_customer FOREIGN KEY (customer_id) REFERENCES customers (id);

ALTER TABLE employees
  ADD UNIQUE KEY (account_id),
  ADD FOREIGN KEY (account_id) REFERENCES accounts (id);

ALTER TABLE products
  ADD FOREIGN KEY (category_id) REFERENCES categories (id);

ALTER TABLE promotions
  ADD CONSTRAINT uk_promotions_promotion_code UNIQUE (promotion_code);

ALTER TABLE promotion_products
  ADD FOREIGN KEY (promotion_id) REFERENCES promotions (id),
  ADD FOREIGN KEY (product_id) REFERENCES products (id);

ALTER TABLE orders
  ADD CONSTRAINT uk_orders_customer_request_key UNIQUE (customer_id, customer_request_key),
  ADD FOREIGN KEY (customer_id) REFERENCES customers (id),
  ADD FOREIGN KEY (employee_id) REFERENCES employees (id),
  ADD CONSTRAINT fk_orders_promotion FOREIGN KEY (promotion_id) REFERENCES promotions (id);

ALTER TABLE order_items
  ADD FOREIGN KEY (order_id) REFERENCES orders (id),
  ADD FOREIGN KEY (product_id) REFERENCES products (id);

ALTER TABLE payments
  MODIFY COLUMN order_id bigint NOT NULL,
  ADD CONSTRAINT uk_payments_order_id UNIQUE (order_id),
  ADD FOREIGN KEY (order_id) REFERENCES orders (id);

ALTER TABLE payment_transaction_attempts
  ADD CONSTRAINT uk_payment_transaction_attempts_txn_ref UNIQUE (txn_ref),
  ADD CONSTRAINT fk_payment_transaction_attempts_payment FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE RESTRICT;

ALTER TABLE newsletter_subscriptions
  ADD CONSTRAINT uk_newsletter_subscriptions_email UNIQUE (email);

ALTER TABLE contact_messages
  ADD INDEX idx_contact_messages_created_at (created_at),
  ADD INDEX idx_contact_messages_status_created_at (status, created_at),
  ADD INDEX idx_contact_messages_customer_id (customer_id),
  ADD CONSTRAINT fk_contact_messages_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL;

ALTER TABLE custom_orders
  ADD FOREIGN KEY (customer_id) REFERENCES customers (id),
  ADD FOREIGN KEY (employee_id) REFERENCES employees (id);

ALTER TABLE purchase_orders
  ADD FOREIGN KEY (supplier_id) REFERENCES suppliers (id),
  ADD CONSTRAINT fk_purchase_orders_employee FOREIGN KEY (employee_id) REFERENCES employees (id);

ALTER TABLE purchase_order_items
  ADD FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders (id),
  ADD FOREIGN KEY (ingredient_id) REFERENCES ingredients (id);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
