export const printOrderReceipt = (order: any, orderItems: any[]) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permita pop-ups no seu navegador para visualizar e baixar o comprovante.');
    return;
  }

  const dateStr = new Date(order.created_at || Date.now()).toLocaleString('pt-BR');
  
  let clientName = order.user_profiles?.full_name || 'Cliente';
  let address = order.address_summary || 'Entrega no Endereço';
  let phone = order.user_profiles?.phone || '';

  if (order.address_summary && order.address_summary.startsWith("Nome: ")) {
    const parts = order.address_summary.split(" | ");
    if (parts.length >= 3) {
      clientName = parts[0].replace("Nome: ", "");
      phone = parts[1].replace("Tel: ", "");
      address = parts.slice(2).join(" | ");
    }
  }

  const itemsHtml = orderItems.map((item: any) => {
    const details = [];
    if (item.size) details.push(`Tamanho: ${item.size}`);
    if (item.border) details.push(`Borda: ${item.border}`);
    if (item.halfAndHalf) {
      const f1 = item.halfAndHalf.flavor1?.name || item.halfAndHalf.flavor1 || '';
      const f2 = item.halfAndHalf.flavor2?.name || item.halfAndHalf.flavor2 || '';
      if (f1 || f2) details.push(`Metades: ${f1} / ${f2}`);
    }
    if (item.extras && item.extras.length > 0) {
      const extrasText = item.extras.map((e: any) => typeof e === 'string' ? e : e.name).join(', ');
      details.push(`Adicionais: ${extrasText}`);
    }
    if (item.observation) details.push(`Obs: ${item.observation}`);

    return `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px dashed #ccc;">
          <strong>${item.quantity}x ${item.name || item.products?.name || 'Pizza'}</strong>
          ${details.length > 0 ? `<br><small style="color: #555; display: block; margin-top: 2px;">${details.join(' • ')}</small>` : ''}
        </td>
        <td style="padding: 8px 0; border-bottom: 1px dashed #ccc; text-align: right; font-weight: bold; vertical-align: top;">
          R$ ${(Number(item.price) * item.quantity).toFixed(2)}
        </td>
      </tr>
    `;
  }).join('');

  const paymentLabels: Record<string, string> = {
    pix: 'PIX na Entrega',
    card: 'Cartão de Crédito/Débito na Entrega',
    cash: 'Dinheiro na Entrega',
    money: 'Dinheiro na Entrega'
  };

  const paymentMethodLabel = paymentLabels[order.payment_method] || order.payment_method || 'Na Entrega';
  const subtotal = Number(order.total_amount) - Number(order.delivery_fee || 0);

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Comprovante Pedido #${order.id} - Pizza Senna</title>
        <style>
          @page { size: auto; margin: 5mm; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            margin: 0 auto; 
            padding: 20px; 
            color: #000; 
            max-width: 420px; 
            background: #fff;
          }
          .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 12px; margin-bottom: 12px; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
          .header p { margin: 3px 0; font-size: 11px; }
          .badge { display: inline-block; background: #000; color: #fff; font-size: 10px; font-weight: bold; padding: 3px 8px; border-radius: 4px; margin-top: 6px; }
          .info-box { margin-bottom: 12px; font-size: 11px; line-height: 1.5; border-bottom: 1px dashed #ccc; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
          .totals { border-top: 2px dashed #000; border-bottom: 2px dashed #000; padding: 10px 0; margin-top: 10px; font-size: 12px; }
          .totals .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .totals .grand-total { font-size: 16px; font-weight: 900; margin-top: 6px; border-top: 1px solid #000; padding-top: 6px; }
          .footer { text-align: center; margin-top: 20px; font-size: 11px; }
          .footer p { margin: 4px 0; }
          .no-print-btn {
            display: block;
            width: 100%;
            padding: 12px;
            background: #e11d48;
            color: #fff;
            text-align: center;
            font-weight: bold;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            margin-bottom: 20px;
            font-size: 14px;
          }
          @media print {
            .no-print-btn { display: none; }
          }
        </style>
      </head>
      <body>
        <button class="no-print-btn" onclick="window.print()">🖨️ IMPRIMIR / SALVAR PDF</button>

        <div class="header">
          <h1>🍕 PIZZARIA SENNA</h1>
          <p>A melhor pizza da cidade!</p>
          <p>Sete Lagoas - MG</p>
          <div class="badge">COMPROVANTE DE PEDIDO (NÃO FISCAL)</div>
          <p style="margin-top: 8px; font-weight: bold; font-size: 13px;">PEDIDO #${order.id}</p>
          <p style="color: #444;">${dateStr}</p>
        </div>

        <div class="info-box">
          <div><strong>Cliente:</strong> ${clientName}</div>
          ${phone ? `<div><strong>Telefone:</strong> ${phone}</div>` : ''}
          <div><strong>Endereço:</strong> ${address}</div>
          <div><strong>Forma de Pgto:</strong> ${paymentMethodLabel}</div>
        </div>

        <table>
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th style="text-align: left; padding-bottom: 4px;">ITEM</th>
              <th style="text-align: right; padding-bottom: 4px;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div class="row"><span>Subtotal:</span> <span>R$ ${subtotal.toFixed(2)}</span></div>
          <div class="row"><span>Taxa de Entrega:</span> <span>R$ ${Number(order.delivery_fee || 0).toFixed(2)}</span></div>
          <div class="row grand-total"><span>TOTAL:</span> <span>R$ ${Number(order.total_amount).toFixed(2)}</span></div>
        </div>

        <div class="footer">
          <p style="font-weight: bold; font-size: 12px;">❤️ MUITO OBRIGADO PELO SEU PEDIDO!</p>
          <p>Pizza Senna deseja a você um excelente apetite!</p>
        </div>

        <script>
          setTimeout(function() {
            window.print();
          }, 300);
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
