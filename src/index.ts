import axios from 'axios';
import dotenv from 'dotenv';

// 環境変数を読み込む
dotenv.config();

const notionToken = process.env.NOTION_TOKEN;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;
const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
const userId = String(process.env.USER_ID);

async function getLatestTodoPage() {
  const response = await axios.post(
    `https://api.notion.com/v1/databases/${notionDatabaseId}/query`,
    {
      filter: {
        property: 'Title', // タイトルプロパティの名前を確認して修正
        text: {
          contains: 'Todo',
        },
      },
      sorts: [
        {
          timestamp: 'created_time', // タイムスタンププロパティを使用
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
    throw new Error('Todoページが見つかりませんでした');
  }

  return pages[0];
}

async function getPageContent(pageId: string) {
  const response = await axios.get(
    `https://api.notion.com/v1/blocks/${pageId}/children`,
    {
      headers: {
        Authorization: `Bearer ${notionToken}`,
        'Notion-Version': '2021-05-13',
      },
    },
  );

  const blocks = response.data.results;
  const content = blocks
    .map((block: any) => {
      if (block.type === 'to_do') {
        const checked = block.to_do.checked ? '✅' : '⬜';
        return `${checked} ${block.to_do.text.map((text: any) => text.plain_text).join('')}`;
      }
      // 他のブロックタイプも必要に応じて処理
      return '';
    })
    .join('\n');

  return content;
}

async function sendToDiscord(message: string) {
  if (!discordWebhookUrl) {
    throw new Error('DISCORD_WEBHOOK_URLが定義されていません');
  }
  await axios.post(discordWebhookUrl, {
    content: message,
  });
}

async function main() {
  try {
    const page = await getLatestTodoPage();
    const pageContent = await getPageContent(page.id);
    const currentDate = new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
    const message = `### 📅 日付: ${currentDate}<@${"852712219132297227"}>\n\n### 📝 最新のTodoページ: \n${page.url}\n### 📋 本日のタスク:\n${pageContent}\n\n`;
    await sendToDiscord(message);
  } catch (error) {
    console.error('エラー:', error);
  }
}

main();
