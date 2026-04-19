CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS citext;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'user');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


DROP TABLE IF EXISTS concerts CASCADE;

CREATE TABLE concerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name TEXT NOT NULL,
  description TEXT,

  total_seats INT NOT NULL CHECK (total_seats > 0),

  reserved_seat INT NOT NULL DEFAULT 0 CHECK (reserved_seat >= 0),
  cancelled_seat INT NOT NULL DEFAULT 0 CHECK (cancelled_seat >= 0),

  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_created_by
    FOREIGN KEY (created_by)
    REFERENCES users(id)
    ON DELETE CASCADE,


  CONSTRAINT check_seat_limit
    CHECK (reserved_seat <= total_seats)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reservation_status') THEN
    CREATE TYPE reservation_status AS ENUM ('RESERVED', 'CANCELLED');
  END IF;
END$$;


CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  concert_id UUID NOT NULL,
  status reservation_status NOT NULL DEFAULT 'RESERVED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMPTZ NULL,

  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_concert
    FOREIGN KEY (concert_id)
    REFERENCES concerts(id)
    ON DELETE CASCADE
);