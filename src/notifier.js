function formatPrice(price) {
  const num = parseFloat(price);
  if (isNaN(num)) return price;
  return num.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' сом';
}

function detectChanges(oldProducts, newProducts) {
  const oldMap = Object.fromEntries(oldProducts.map((p) => [p.uid, p]));
  const newMap = Object.fromEntries(newProducts.map((p) => [p.uid, p]));

  const added = [];
  const priceChanged = [];
  const removed = [];

  for (const [uid, product] of Object.entries(newMap)) {
    if (!oldMap[uid]) {
      added.push(product);
    } else if (oldMap[uid].price !== product.price) {
      priceChanged.push({ old: oldMap[uid], new: product });
    }
  }

  for (const [uid, product] of Object.entries(oldMap)) {
    if (!newMap[uid]) {
      removed.push(product);
    }
  }

  return { added, priceChanged, removed };
}

function hasChanges(changes) {
  return (
    changes.added.length > 0 ||
    changes.priceChanged.length > 0 ||
    changes.removed.length > 0
  );
}

function formatChangeMessage(changes) {
  const lines = ['🔔 *Обновление Trade-in товаров iStore*\n'];

  if (changes.added.length > 0) {
    lines.push('✅ *Новые товары:*');
    for (const p of changes.added) {
      lines.push(`• ${p.title} — ${formatPrice(p.price)}`);
    }
    lines.push('');
  }

  if (changes.priceChanged.length > 0) {
    lines.push('💰 *Изменение цены:*');
    for (const { old: o, new: n } of changes.priceChanged) {
      const arrow = parseFloat(n.price) < parseFloat(o.price) ? '↓' : '↑';
      lines.push(
        `• ${n.title}\n  ${formatPrice(o.price)} → ${formatPrice(n.price)} ${arrow}`
      );
    }
    lines.push('');
  }

  if (changes.removed.length > 0) {
    lines.push('❌ *Убраны из продажи:*');
    for (const p of changes.removed) {
      lines.push(`• ${p.title}`);
    }
  }

  return lines.join('\n');
}

async function notifyAll(bot, subscribers, changes) {
  const message = formatChangeMessage(changes);
  const results = await Promise.allSettled(
    subscribers.map((chatId) =>
      bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' })
    )
  );
  const failed = results.filter((r) => r.status === 'rejected').length;
  if (failed > 0) {
    console.warn(`Failed to send notifications to ${failed} subscribers`);
  }
  return results.length - failed;
}

module.exports = { detectChanges, hasChanges, notifyAll, formatChangeMessage, formatPrice };
