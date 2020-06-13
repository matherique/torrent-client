export default function log(text: string, data: any[], callback?: () => void): void {
  console.log('\x1b[31m%s\x1b[0m', text, ...data);  // Red

  if (callback) 
    callback();
}
