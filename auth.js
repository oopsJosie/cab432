import { Router } from 'express';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  AdminInitiateAuthCommand
} from '@aws-sdk/client-cognito-identity-provider';

import dotenv from 'dotenv';
dotenv.config();

const router = Router();

const client = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION
});

// 注册
router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;
  const command = new SignUpCommand({
    ClientId: process.env.COGNITO_CLIENT_ID,
    Username: username,
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: email }
    ]
  });
  try {
    await client.send(command);
    res.json({ message: 'Registered. Please check your email to confirm.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 邮箱验证
router.post('/confirm', async (req, res) => {
  const { username, code } = req.body;
  const command = new ConfirmSignUpCommand({
    ClientId: process.env.COGNITO_CLIENT_ID,
    Username: username,
    ConfirmationCode: code
  });
  try {
    await client.send(command);
    res.json({ message: 'Email confirmed.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 登录
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const command = new AdminInitiateAuthCommand({
    AuthFlow: 'ADMIN_NO_SRP_AUTH',
    ClientId: process.env.COGNITO_CLIENT_ID,
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password
    }
  });
  try {
    const response = await client.send(command);
    res.json({
      message: 'Login successful',
      token: response.AuthenticationResult?.IdToken
    });
  } catch (err) {
    res.status(401).json({ error: 'Login failed. Check credentials or email confirmation.' });
  }
});

export default router;