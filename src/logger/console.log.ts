export default function log(...data: any[]): void {
  console.log('\x1b[31m%s\x1b[0m', ...data);  // Red
}
