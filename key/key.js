const crypto = require('crypto');

// 生成一个32字节的随机字符串，并以十六进制表示
const secretKey = crypto.randomBytes(32).toString('hex');

console.log('你的JWT密钥是:');
console.log(secretKey);

// 这是一个示例，展示如何使用这个密钥来生成和验证JWT
const jwt = require('jsonwebtoken');

const payload = {
  userId: '0',
  username: 'henri'
};

// 使用生成的密钥来签名JWT
const token = jwt.sign(payload, secretKey);
console.log('\n生成的JWT Token是:');
console.log(token);

// 验证Token的有效性
try {
  const decoded = jwt.verify(token, secretKey);
  console.log('\nToken验证成功，解码后的payload是:');
  console.log(decoded);
} catch (err) {
  console.error('\nToken验证失败:', err.message);
}