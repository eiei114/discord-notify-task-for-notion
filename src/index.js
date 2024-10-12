'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
// src/index.ts
const axios_1 = __importDefault(require('axios'));
const dotenv_1 = __importDefault(require('dotenv'));
// 環境変数を読み込む
dotenv_1.default.config();
const notionToken = process.env.NOTION_TOKEN;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;
const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
function getLatestTodoPage() {
  return __awaiter(this, void 0, void 0, function* () {
    const response = yield axios_1.default.post(
      `https://api.notion.com/v1/databases/${notionDatabaseId}/query`,
      {
        filter: {
          property: 'Name',
          text: {
            contains: 'Todo',
          },
        },
        sorts: [
          {
            property: 'Created time',
            direction: 'descending',
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${notionToken}`,
          'Notion-Version': '2021-05-13',
          'Content-Type': 'application/json',
        },
      },
    );
    const pages = response.data.results;
    if (pages.length === 0) {
      throw new Error('No Todo pages found');
    }
    return pages[0];
  });
}
function sendToDiscord(message) {
  return __awaiter(this, void 0, void 0, function* () {
    if (!discordWebhookUrl) {
      throw new Error('DISCORD_WEBHOOK_URL is not defined');
    }
    yield axios_1.default.post(discordWebhookUrl, {
      content: message,
    });
  });
}
function main() {
  return __awaiter(this, void 0, void 0, function* () {
    try {
      const page = yield getLatestTodoPage();
      const message = `Latest Todo Page: ${page.url}`;
      yield sendToDiscord(message);
    } catch (error) {
      console.error('Error:', error);
    }
  });
}
main();
