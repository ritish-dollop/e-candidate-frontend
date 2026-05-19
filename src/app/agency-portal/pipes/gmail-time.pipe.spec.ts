import { GmailTimePipe } from './gmail-time.pipe';

describe('GmailTimePipe', () => {
  it('create an instance', () => {
    const pipe = new GmailTimePipe();
    expect(pipe).toBeTruthy();
  });
});
