# Welcome to your Xordon project

This is a Xordon project.

## How can I edit this code?

There are several ways of editing your app:

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Xordon.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly on GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

## Configuration

### Backend Setup

1. **Database Configuration**
   - Copy `backend/.env.example` to `backend/.env`
   - Update database credentials

2. **Phone Number Provisioning** (Optional)
   - See [SIGNALWIRE_SETUP.md](./SIGNALWIRE_SETUP.md) for detailed instructions
   - Configure SignalWire or Twilio credentials in `backend/.env`

3. **AI Features** (Optional)
   - Add your OpenAI API key to `backend/.env`

See `backend/.env.example` for all available configuration options.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Build the app with `npm run build` and serve it with `npm run preview`, or deploy the output using your preferred hosting provider.
