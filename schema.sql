-- FraudLens MySQL Database Schema

CREATE DATABASE IF NOT EXISTS fraudlens;
USE fraudlens;

-- 1. Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gstin VARCHAR(15) UNIQUE NULL,
    status VARCHAR(50) DEFAULT 'Unverified'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Policy Rules Table
CREATE TABLE IF NOT EXISTS policy_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) UNIQUE NOT NULL,
    max_amount FLOAT NOT NULL,
    approval_threshold FLOAT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    amount FLOAT NOT NULL,
    category VARCHAR(100) NOT NULL,
    employee_id INT NOT NULL,
    vendor_id INT NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    verdict VARCHAR(50) NULL,
    reasoning_trail JSON NULL,
    receipt_url VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
