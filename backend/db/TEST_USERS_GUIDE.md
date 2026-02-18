# How to Insert Test Users into Render PostgreSQL

## Option 1: Using DBeaver or pgAdmin (Recommended)

1. **Connect to your Render database**
   - Host: `dpg-d6a35an5r7bs73fgs510-a.oregon-postgres.render.com`
   - Port: `5432`
   - Database: `railway_v3pl`
   - Username: `railway_v3pl_user`
   - Password: `cWUU8smbe7Ig2jJwmIzju70neBnW7BCN`

2. **Run the SQL**
   - Open `backend/db/init_users.sql`
   - Execute it in your database tool

## Option 2: Using psql Command Line

```bash
psql -h dpg-d6a35an5r7bs73fgs510-a.oregon-postgres.render.com \
     -U railway_v3pl_user \
     -d railway_v3pl \
     -f backend/db/init_users.sql
```

When prompted, enter password: `cWUU8smbe7Ig2jJwmIzju70neBnW7BCN`

## Test Users Created

| Username | Password | Role |
|----------|----------|------|
| `user1` | `password123` | PASSENGER |
| `user2` | `password123` | PASSENGER |
| `admin` | `password123` | RPF_ADMIN |
| `station_master` | `password123` | STATION_MASTER |

## Test Login with These Credentials

### Using Thunder Client/Postman

```
POST http://localhost:8081/auth/login
Content-Type: application/json

{
  "username": "user1",
  "password": "password123"
}
```

### Expected Response (200 OK)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "PASSENGER"
}
```

## Using the JWT Token

Once you get the token, use it to access protected endpoints:

```
GET http://localhost:8081/complaints
Authorization: Bearer <your_token_here>
```

## Verify Users Were Inserted

```sql
SELECT id, username, role FROM users;
```

Should show 4 test users.
