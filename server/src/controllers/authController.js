const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../config/prisma');
const termii = require('../services/termii');
const mailer = require('../services/mailer');

const JWT_SECRET = process.env.JWT_SECRET || 'dfos_jwt_super_secret_key_2026_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  matricNo: z.string().optional().nullable(),
  departmentId: z.string().min(1, 'Department is required'),
  role: z.enum(['STUDENT', 'STAFF', 'SUPER_ADMIN']).optional().default('STUDENT'),
});

const verifyOtpSchema = z.object({
  phone: z.string().optional(),
  email: z.string().optional(),
  code: z.string().min(4, 'OTP code is required'),
});

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or Matric Number is required'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, 'Email, Phone, or Matric Number is required'),
});

const resetPasswordSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  code: z.string().min(4, 'OTP code is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * Helper to issue JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Student / User Registration
 */
async function register(req, res, next) {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { name, email, phone, password, matricNo, departmentId, role } = validatedData;

    const emailClean = email.toLowerCase().trim();
    const phoneClean = phone.trim();
    const matricClean = matricNo ? matricNo.trim().toUpperCase() : null;

    // Check existing email/phone/matricNo
    const existingEmail = await prisma.user.findUnique({ where: { email: emailClean } });
    if (existingEmail) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const existingPhone = await prisma.user.findUnique({ where: { phone: phoneClean } });
    if (existingPhone) {
      return res.status(400).json({ error: 'An account with this phone number already exists.' });
    }

    if (matricClean) {
      const existingMatric = await prisma.user.findUnique({ where: { matricNo: matricClean } });
      if (existingMatric) {
        return res.status(400).json({ error: 'An account with this matriculation number already exists.' });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create unverified user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: emailClean,
        phone: phoneClean,
        passwordHash,
        matricNo: matricClean,
        departmentId,
        role: role || 'STUDENT',
        isVerified: false,
      },
      include: { department: true },
    });

    // Generate 6-digit OTP code
    const code = termii.generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    await prisma.otpVerification.create({
      data: {
        identifier: phoneClean,
        code,
        expiresAt,
      },
    });

    // Send OTP via SMS (Termii) and Email (Mailer) non-blockingly
    await termii.sendOtp(phoneClean, code);
    await mailer.sendOtpEmail(emailClean, user.name, code);

    return res.status(201).json({
      message: 'Registration successful. Verification OTP sent via Termii SMS and email.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        matricNo: user.matricNo,
        role: user.role,
        isVerified: user.isVerified,
        department: user.department,
      },
      otpInfo: {
        phone: user.phone,
        code, // Returned for stylish testing banner
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
}

/**
 * Verify OTP code
 */
async function verifyOtp(req, res, next) {
  try {
    const { phone, email, code } = verifyOtpSchema.parse(req.body);

    const identifier = (phone || email || '').trim();
    if (!identifier) {
      return res.status(400).json({ error: 'Phone number or email is required for OTP verification.' });
    }

    // Find latest active OTP
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        OR: [
          { identifier },
          { identifier: identifier.toLowerCase() },
        ],
        code: code.trim(),
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired verification OTP code.' });
    }

    // Mark OTP as used
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    // Update user isVerified
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: identifier },
          { email: identifier },
          { email: identifier.toLowerCase() },
        ],
      },
      include: { department: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
      include: { department: true },
    });

    const token = generateToken(updatedUser);

    return res.json({
      message: 'Account verified successfully.',
      token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        matricNo: updatedUser.matricNo,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified,
        department: updatedUser.department,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
}

/**
 * Resend OTP code
 */
async function resendOtp(req, res, next) {
  try {
    const { phone, email } = req.body;
    const rawId = (phone || email || '').trim();

    if (!rawId) {
      return res.status(400).json({ error: 'Phone number or email is required.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: rawId },
          { email: rawId },
          { email: rawId.toLowerCase() },
        ],
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const code = termii.generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpVerification.create({
      data: {
        identifier: user.phone,
        code,
        expiresAt,
      },
    });

    await termii.sendOtp(user.phone, code);
    await mailer.sendOtpEmail(user.email, user.name, code);

    return res.json({
      message: 'Fresh verification OTP code sent via Termii SMS and email.',
      phone: user.phone,
      code, // Returned for test banner
    });
  } catch (error) {
    next(error);
  }
}

/**
 * User Login
 */
async function login(req, res, next) {
  try {
    const { identifier, password } = loginSchema.parse(req.body);
    const cleanId = identifier.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanId },
          { email: cleanId.toLowerCase() },
          { matricNo: cleanId },
          { matricNo: cleanId.toUpperCase() },
          { phone: cleanId },
        ],
      },
      include: { department: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid login credentials.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid login credentials.' });
    }

    if (!user.isVerified) {
      // Trigger new OTP so they can complete verification
      const code = termii.generateOtpCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.otpVerification.create({
        data: {
          identifier: user.phone,
          code,
          expiresAt,
        },
      });

      await termii.sendOtp(user.phone, code);
      await mailer.sendOtpEmail(user.email, user.name, code);

      return res.status(403).json({
        error: 'Your account is not verified yet. A verification OTP code has been sent to your phone and email.',
        requiresOtp: true,
        phone: user.phone,
        email: user.email,
        code, // Returned for test banner
      });
    }

    const token = generateToken(user);

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        matricNo: user.matricNo,
        role: user.role,
        isVerified: user.isVerified,
        department: user.department,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
}

/**
 * Request Password Reset OTP
 */
async function forgotPassword(req, res, next) {
  try {
    const { identifier } = forgotPasswordSchema.parse(req.body);
    const cleanId = identifier.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanId },
          { email: cleanId.toLowerCase() },
          { phone: cleanId },
          { matricNo: cleanId },
          { matricNo: cleanId.toUpperCase() },
        ],
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'No account found matching the provided email or matric number.' });
    }

    const code = termii.generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await prisma.otpVerification.create({
      data: {
        identifier: user.phone,
        code,
        expiresAt,
      },
    });

    await termii.sendOtp(user.phone, code);
    await mailer.sendOtpEmail(user.email, user.name, code);

    return res.json({
      message: 'Password reset OTP code sent via Termii SMS and email.',
      phone: user.phone,
      email: user.email,
      identifier: cleanId,
      code, // Returned for test banner
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
}

/**
 * Reset Password with OTP
 */
async function resetPassword(req, res, next) {
  try {
    const { identifier, code, newPassword } = resetPasswordSchema.parse(req.body);
    const cleanId = identifier.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanId },
          { email: cleanId.toLowerCase() },
          { phone: cleanId },
          { matricNo: cleanId },
          { matricNo: cleanId.toUpperCase() },
        ],
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // Verify OTP code
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        OR: [
          { identifier: user.phone },
          { identifier: user.email },
          { identifier: user.email.toLowerCase() },
        ],
        code: code.trim(),
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP code.' });
    }

    // Mark OTP as used
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    // Hash new password and update user
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        isVerified: true,
      },
    });

    return res.json({
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
}

/**
 * Get logged in user profile
 */
async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        matricNo: true,
        role: true,
        isVerified: true,
        createdAt: true,
        department: true,
      },
    });
    return res.json({ user });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  getMe,
};
