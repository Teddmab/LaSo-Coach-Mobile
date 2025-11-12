// Quick Node import test for firebaseAuthServiceNew and FirebaseAuthContext
try {
  require('../src/services/firebaseAuthServiceNew');
  require('../src/context/FirebaseAuthContext');
  console.log('Import test: OK');
} catch (err) {
  console.error('Import test: FAILED', err);
  process.exit(1);
}
