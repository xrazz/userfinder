const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = {
  "type": "service_account",
  "project_id": "painpoints-ad7db",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCSdMOovsUcIK2g\nwBYlcdw7Vlt/6kXMsC163KvESMGY78F1sJOs6eUJMTPMZ162I6veNGefUlCIBeHf\n3VTG+ywg9G4IXo19Tct9MPOAsmCvuAPQ0IiBUmK6NT5jxr986OPplQcql9nuW59T\n1EVDaU5ygnPPcG0TiN1XYTQ5s8n/vumZbCkDkXPipPeDKAzeE94gq5YhR/hEZruL\nqg2KErYmEGMcfup13CyEE+b3BspyTzy0rBrN4ygRLOQbIbYRIQLkZHoQ4AVeM16G\nia+YbyZ1d3mpwU+TW2Octljso4C4rM02NO7LBFDFtpD41AGdZIm7Gdhfi338aYFA\n/NLBFxn3AgMBAAECggEAPLBpIeSHvqul936Rzst7dRVIjl2wtezts8N85DY4D12O\n3+ufjmBQGjqK2fGd9EEc59P0erd8CpnRa1iG2Hvd4fwYGpy/6gRSRhsCVLrWSQqq\nfh3j6x8OLVaB94u07xh81V79nL9XPig2gmDsoM4jBV2ciwHuGVG2Uw7DOwQPOUwt\nY5WUx9ncFlhCIiD46p7bmqmTjnuwPAAyy8aGyDSIDS/m/QCB97PTeCr8UKZtXejB\nSwa3L953qA4ICPOnMlYDe/HxvGPanPkw8MDi7HyyTbAzdDUYUkZ6AFXpje/n6Wd9\niUgE1/LzE7P+n20sXWPIyUxsjr1xiCDu2zYlkb8w/QKBgQDIZCmIN8QebAYlHFyZ\nYIjBUh4X4AIFmYmKStZgJ2prmrq5UEYpvyYHYyPtC0RUMqr3SnD1aEC7zA5V43xn\n4CY17RExj6CeRZ1cYwVOJQLLxBs45bHUeqa6D3tqdjd6FBtM1dcw12ytXPGtwvee\n66Lh/aKZTsHqmw/RrNadEQEjpQKBgQC7GQmh0JbkRwvc8QFGpwRz9F/zpH1OwzL8\nHcfkxMBRIGpA+KiBEGWo9oOOvsFYPuCCXmVf8H/Yp9YnjbeepYR3g+1HBZI7uL5y\n5iNcjN+oCcy4GfaxkGLpxEgf+gaPgzpPyisq7UOvi1+B2rQymFdbEHDGw1uxdtkI\ngI5nHxIkawKBgE0tzpUpLT6uSjuWzc9Az8rtLqvxWbYAaWm64xALfkBNSqc+1JcV\niLcFpvuQAFQRY6l0oUbTTUNHFypbQDndqbnRQXL+J1Vt6GqBtLRhKs+CCx4B0VjN\nmFNGzTi2qS06ez0/iu7DuZaXmnlbAvXROV2iyzISlDsgV5pg4BOEThUFAoGAV7/R\nbawX6O6NWM1LzOguRXf6vJmMD7GrKuWIx/mjPSlXzCsTVJztIQalAwDiS1IKF/rP\nzuRMAcANx7VGxkhYzXj5gxLQ1+O4psjbEuAbUYNvGXVL51GRopPlQ+IOy6Y/Zgaq\nolJvKVjTrWJ2mzgp2FLoocAkNCJKfhtVLnY7GwsCgYApjasWM4q6urZvLDNPqq2h\naiLR4bOTaKxaYHv41uvu5NWg/HY/B9QD5V5eTcgTLCLFXQOjMz2UYYrSnDVK8Tgo\n13PLy4EbjAlNZ9Mq1vaEPX7y+tKJmFaZX64VQcLf2V1S1tSUmrUmZTJImog7Jhuq\ngdyhE+DirVQu71r4YZYwkA==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-exgsw@painpoints-ad7db.iam.gserviceaccount.com"
};

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const date = new Date('2024-01-05');

// Query users
db.collection('users')
  .where('lastCreditReset', '>=', date)
  .get()
  .then(snapshot => {
    // Create CSV content with header
    let csvContent = 'Email\n';
    
    // Add each email as a new line
    snapshot.forEach(doc => {
      csvContent += `${doc.id}\n`;
    });
    
    // Write to file
    fs.writeFileSync('users_after_jan5.csv', csvContent);
    console.log('Emails have been saved to users_after_jan5.csv');
    process.exit();
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  }); 