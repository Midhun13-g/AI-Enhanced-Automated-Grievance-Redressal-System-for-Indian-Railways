# Render PostgreSQL Integration Guide

## Steps to Integrate Render PostgreSQL Database

### 1. Create a PostgreSQL Database on Render

1. Go to [Render.com](https://render.com) and sign in
2. Click **New +** → **PostgreSQL**
3. Fill in the database details:
   - **Name**: Railway DB (or any name)
   - **Database**: `railway_db` (or your preferred name)
   - **User**: `railwaydb` (or your preferred username)
   - Leave other settings at defaults
4. Click **Create Database**
5. Wait for the database to be created (this may take a few minutes)

### 2. Get Your Database Connection Details

Once your database is created, you'll see a credentials section showing:

- **Host**: Something like `dpg-xxxxx.render.com`
- **Port**: `5432`
- **Database**: `railway_db`
- **User**: `railwaydb`
- **Password**: Copy this securely

The **Internal Database URL** will look like:

```
jdbc:postgresql://railwaydb:your_password@dpg-xxxxx.render.com:5432/railway_db
```

⚠️ **Important**: The URL must include the `jdbc:` prefix and `:5432` port number!

### 3. Set Environment Variables in Your Application

The application now uses environment variables for database configuration:

| Variable | Value | Example |
|----------|-------|---------|
| `DB_URL` | Full PostgreSQL connection string | `postgresql://user:password@host:5432/database` |
| `DB_USERNAME` | Database username | `railwaydb` |
| `DB_PASSWORD` | Database password | `your_secure_password` |

### 4. Deploy Backend on Render

1. Create a new **Web Service** on Render:
   - Connect your GitHub repository
   - Set **Build Command**: `./mvnw clean package`
   - Set **Start Command**: `java -jar target/backend-0.0.1-SNAPSHOT.jar` (adjust jar name as needed)

2. Add Environment Variables to your Render service:
   - Go to **Environment** in your service settings
   - Add the three variables from Step 3:
     - `DB_URL`: Your Render PostgreSQL internal URL
     - `DB_USERNAME`: Your database username
     - `DB_PASSWORD`: Your database password

3. Deploy your application

### 5. Verify Connection

Once deployed, check your application logs to ensure the database connection is successful:

```
o.s.b.a.DataSourceHealthIndicator      : HikariPool-1 - Pool stats (active=1, idle=2, pending=0)
```

## Application Configuration

The application is pre-configured to use environment variables:

**application.yml**:

```yaml
spring:
  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5432/railwaydb}
    username: ${DB_USERNAME:railway}
    password: ${DB_PASSWORD:railwaypass}
```

The syntax `${VAR_NAME:default_value}` means:

- Use the environment variable if set
- Otherwise, use the default value (useful for local development)

## Local Development

For local development, create a `.env` file (don't commit this):

```
DB_URL=jdbc:postgresql://localhost:5432/railwaydb
DB_USERNAME=railway
DB_PASSWORD=railwaypass
```

Then load it in your IDE or use:

```bash
export DB_URL=jdbc:postgresql://localhost:5432/railwaydb
export DB_USERNAME=railway
export DB_PASSWORD=railwaypass
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

## Troubleshooting

### Connection Refused

- Ensure the database is running on Render
- Check that you're using the **Internal Database URL** (not the External URL)
- Verify credentials are correct

### Wrong Credentials

- Double-check the password in Render's database dashboard
- Ensure there are no extra spaces in environment variables

### Database URL Format

Render PostgreSQL JDBC URLs must follow this format:

```
jdbc:postgresql://username:password@host:5432/database_name
```

✅ MUST include:

- `jdbc:` prefix
- `:5432` port number
- Full credentials with password

## Schema Migration

The application uses Hibernate with `ddl-auto: update`, which means it will automatically:

1. Create tables if they don't exist
2. Update schema based on entity definitions
3. Preserve existing data

To run migrations manually, check the `backend/db/schema.sql` file.
