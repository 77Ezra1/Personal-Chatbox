/**
 * 加密服务
 * 使用 AES-256-GCM 加密算法来安全存储密码
 */

const crypto = require('crypto');

// 加密算法配置
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64;
const AUTH_TAG_LENGTH = 16;

class EncryptionService {
  /**
   * 生成随机盐值
   */
  generateSalt() {
    return crypto.randomBytes(SALT_LENGTH).toString('hex');
  }

  /**
   * 从主密码和盐值派生加密密钥
   * 使用 PBKDF2 算法
   */
  deriveKey(masterPassword, salt) {
    return crypto.pbkdf2Sync(
      masterPassword,
      salt,
      100000, // 迭代次数
      KEY_LENGTH,
      'sha512'
    );
  }

  /**
   * 加密密码
   * @param {string} plaintext - 要加密的明文密码
   * @param {string} masterPassword - 用户的主密码
   * @param {string} salt - 盐值
   * @returns {string} 加密后的密码（包含IV和认证标签）
   */
  encrypt(plaintext, masterPassword, salt) {
    try {
      // 从主密码派生密钥
      const key = this.deriveKey(masterPassword, salt);

      // 生成随机初始化向量
      const iv = crypto.randomBytes(IV_LENGTH);

      // 创建加密器
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

      // 加密数据
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // 获取认证标签
      const authTag = cipher.getAuthTag();

      // 组合 IV + 认证标签 + 加密数据
      return iv.toString('hex') + authTag.toString('hex') + encrypted;
    } catch (error) {
      throw new Error('加密失败: ' + error.message);
    }
  }

  /**
   * 解密密码
   * @param {string} encryptedData - 加密的数据
   * @param {string} masterPassword - 用户的主密码
   * @param {string} salt - 盐值
   * @returns {string} 解密后的明文密码
   */
  decrypt(encryptedData, masterPassword, salt) {
    try {
      // 从主密码派生密钥
      const key = this.deriveKey(masterPassword, salt);

      // 提取 IV（前32个字符，16字节的hex）
      const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), 'hex');

      // 提取认证标签（接下来32个字符，16字节的hex）
      const authTag = Buffer.from(
        encryptedData.slice(IV_LENGTH * 2, IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2),
        'hex'
      );

      // 提取加密数据
      const encrypted = encryptedData.slice(IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2);

      // 创建解密器
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      // 解密数据
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error('解密失败: ' + error.message);
    }
  }

  /**
   * 哈希主密码（用于验证）
   * @param {string} password - 主密码
   * @param {string} salt - 盐值
   * @returns {string} 密码哈希
   */
  hashPassword(password, salt) {
    return crypto.pbkdf2Sync(
      password,
      salt,
      100000,
      64,
      'sha512'
    ).toString('hex');
  }

  /**
   * 验证主密码
   * @param {string} password - 用户输入的密码
   * @param {string} hash - 存储的密码哈希
   * @param {string} salt - 盐值
   * @returns {boolean} 密码是否正确
   */
  verifyPassword(password, hash, salt) {
    const inputHash = this.hashPassword(password, salt);
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(inputHash, 'hex')
    );
  }

  /**
   * 生成随机密码
   * @param {number} length - 密码长度
   * @param {object} options - 密码选项
   * @returns {string} 生成的密码
   */
  generatePassword(length = 16, options = {}) {
    const {
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
      excludeAmbiguous = true
    } = options;

    let charset = '';
    let password = '';

    // 构建字符集
    if (includeLowercase) {
      charset += excludeAmbiguous ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
    }
    if (includeUppercase) {
      charset += excludeAmbiguous ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }
    if (includeNumbers) {
      charset += excludeAmbiguous ? '23456789' : '0123456789';
    }
    if (includeSymbols) {
      charset += excludeAmbiguous ? '!@#$%^&*-_+=?' : '!@#$%^&*()_+-=[]{}|;:,.<>?';
    }

    if (charset.length === 0) {
      throw new Error('至少需要选择一种字符类型');
    }

    // 生成密码
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      password += charset[randomBytes[i] % charset.length];
    }

    return password;
  }

  /**
   * 评估密码强度
   * @param {string} password - 要评估的密码
   * @returns {object} 密码强度信息
   */
  checkPasswordStrength(password) {
    const length = password.length;
    let score = 0;
    const feedback = [];

    // 长度评分
    if (length >= 8) score += 1;
    if (length >= 12) score += 1;
    if (length >= 16) score += 1;
    else if (length < 8) feedback.push('密码长度至少应为8个字符');

    // 字符类型评分
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('应包含小写字母');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('应包含大写字母');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('应包含数字');

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push('应包含特殊字符');

    // 重复字符检查
    if (/(.)\1{2,}/.test(password)) {
      score -= 1;
      feedback.push('避免使用重复字符');
    }

    // 常见模式检查
    const commonPatterns = ['123', 'abc', 'password', 'qwerty', '111'];
    if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
      score -= 1;
      feedback.push('避免使用常见模式');
    }

    // 计算强度等级
    let strength = 'weak';
    let strengthText = '弱';
    let color = 'red';

    if (score >= 6) {
      strength = 'strong';
      strengthText = '强';
      color = 'green';
    } else if (score >= 4) {
      strength = 'medium';
      strengthText = '中等';
      color = 'orange';
    }

    return {
      score: Math.max(0, score),
      maxScore: 7,
      strength,
      strengthText,
      color,
      feedback: feedback.length > 0 ? feedback : ['密码强度良好']
    };
  }
}

module.exports = new EncryptionService();
