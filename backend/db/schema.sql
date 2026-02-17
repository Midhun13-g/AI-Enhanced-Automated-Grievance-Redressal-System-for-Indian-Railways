-- PostgreSQL schema for AI-Enhanced Railway Grievance Redressal System

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (
        role IN (
            'PASSENGER',
            'STATION_MASTER',
            'RPF_ADMIN'
        )
    ),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    passenger_name VARCHAR(100) NOT NULL,
    complaint_text TEXT NOT NULL,
    category VARCHAR(30),
    urgency_score INT DEFAULT 0,
    status VARCHAR(20) NOT NULL CHECK (
        status IN (
            'PENDING',
            'OPEN',
            'IN_PROGRESS',
            'RESOLVED'
        )
    ),
    ai_metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE complaint_history (
    id SERIAL PRIMARY KEY,
    complaint_id INT NOT NULL REFERENCES complaints (id) ON DELETE CASCADE,
    old_status VARCHAR(20) NOT NULL,
    new_status VARCHAR(20) NOT NULL,
    updated_by INT NOT NULL REFERENCES users (id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_complaints_urgency_score ON complaints (urgency_score DESC);

CREATE INDEX idx_complaints_status ON complaints (status);

CREATE INDEX idx_complaints_text_fts ON complaints USING GIN (
    to_tsvector ('english', complaint_text)
);

-- Sample data
INSERT INTO
    users (username, password, role)
VALUES (
        'passenger1',
        '$2a$10$hashedpassword1',
        'PASSENGER'
    ),
    (
        'stationmaster1',
        '$2a$10$hashedpassword2',
        'STATION_MASTER'
    ),
    (
        'rpfadmin1',
        '$2a$10$hashedpassword3',
        'RPF_ADMIN'
    );

INSERT INTO
    complaints (
        passenger_name,
        complaint_text,
        category,
        urgency_score,
        status,
        ai_metadata
    )
VALUES (
        'John Doe',
        'There is a security issue at the station.',
        'Security',
        90,
        'PENDING',
        '{"ai": "pending"}'
    ),
    (
        'Jane Smith',
        'The waiting room is not clean.',
        'Maintenance',
        45,
        'PENDING',
        '{"ai": "pending"}'
    );