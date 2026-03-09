import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailService } from './email.service';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<any>): Promise<void> {
    const { to, subject, html } = job.data;
    console.log(`Sending email to ${to}: ${subject}`);
    await this.emailService.sendEmail(to, subject, html);
  }
}
