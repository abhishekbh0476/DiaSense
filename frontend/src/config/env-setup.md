# Environment Configuration Setup

## Required Environment Variables

Create a `.env.local` file in the root of your frontend directory with the following variables:

```bash
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/glucotrack?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# Application Environment
NODE_ENV=development
```

## MongoDB Atlas Setup Instructions

1. **Create MongoDB Atlas Account**
   - Go to https://www.mongodb.com/atlas
   - Sign up for a free account

2. **Create a Cluster**
   - Choose the free tier (M0)
   - Select a cloud provider and region
   - Name your cluster (e.g., "glucotrack-cluster")

3. **Configure Database Access**
   - Go to Database Access in the left sidebar
   - Add a new database user
   - Choose "Password" authentication
   - Create a username and strong password
   - Give the user "Read and write to any database" privileges

4. **Configure Network Access**
   - Go to Network Access in the left sidebar
   - Add IP Address
   - For development, you can add "0.0.0.0/0" (allows access from anywhere)
   - For production, add only your server's IP addresses

5. **Get Connection String**
   - Go to Clusters and click "Connect"
   - Choose "Connect your application"
   - Select "Node.js" and version "4.1 or later"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with "glucotrack" or your preferred database name

## Security Notes

- **Never commit `.env.local` to version control**
- **Use strong, unique passwords for database users**
- **In production, restrict network access to specific IP addresses**
- **Use a strong, random JWT secret (minimum 32 characters)**
- **Consider using environment-specific secrets**

## Example .env.local File

```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://glucotrack_user:MyStrongPassword123@glucotrack-cluster.abc123.mongodb.net/glucotrack?retryWrites=true&w=majority

# JWT
JWT_SECRET=my-super-secret-jwt-key-that-is-at-least-32-characters-long-and-random
JWT_EXPIRES_IN=7d

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=another-secret-key-for-nextauth

# Environment
NODE_ENV=development
```

## Testing the Connection

After setting up your environment variables, you can test the MongoDB connection by:

1. Installing dependencies: `npm install`
2. Starting the development server: `npm run dev`
3. Trying to register a new user through the sign-up form
4. Check the browser console and terminal for any connection errors

## Troubleshooting

### Common Issues:

1. **Connection Timeout**
   - Check your network access settings in MongoDB Atlas
   - Ensure your IP address is whitelisted

2. **Authentication Failed**
   - Verify your username and password in the connection string
   - Check that the database user has proper permissions

3. **Invalid Connection String**
   - Ensure you've replaced `<password>` and `<dbname>` placeholders
   - Check for any special characters that need URL encoding

4. **JWT Errors**
   - Ensure JWT_SECRET is at least 32 characters long
   - Use a random, secure secret key

### Getting Help:

- MongoDB Atlas Documentation: https://docs.atlas.mongodb.com/
- Next.js Environment Variables: https://nextjs.org/docs/basic-features/environment-variables
- JWT Best Practices: https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/
