import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 10,
  iterations: 10,
};

export default function () {
  3;
  const url = 'http://localhost:3000/ollama/generate';

  const payload = JSON.stringify({
    prompt:
      'Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.\n\n### Instruction:\nExtract issues from the user review in JSON format. For each issue, provide: label, functionality, severity (1-5), likelihood (1-5), category (Bug, User Experience, Performance, Security, Compatibility, Functionality, UI, Connectivity, Localization, Accessibility, Data Handling, Privacy, Notifications, Account Management, Payment, Content Quality, Support, Updates, Syncing, Customization), and the sentence.\n\n### Input:\nEvery time I try to add an item to the cart, the app crashes. Also, the page loading is very slow.\n\n### Response:\n',
    model: 'tinyllama',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: '240s',
  };

  http.post(url, payload, params);
  sleep(1);
}
