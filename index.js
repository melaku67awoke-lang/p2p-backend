function fallbackCopyText(text, copyTextEl) {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";  // Avoid scrolling to bottom
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    showCopiedFeedback(copyTextEl);
                } else {
                    alert('Failed to copy address');
                }
            } catch (err) {
                alert('Unable to copy to clipboard');
            }
            document.body.removeChild(textArea);
        }

        function showCopiedFeedback(copyTextEl) {
            copyTextEl.innerText = "Copied!";
            setTimeout(() => {
                copyTextEl.innerText = "Copy";
            }, 2000);
        }

        function openWithdrawModal() {
            document.getElementById('withdrawAmountInput').value = '';
            document.getElementById('withdrawAddressInput').value = '';
            document.getElementById('withdrawAvailableBalance').innerText = userWalletBalance.toFixed(2);
            document.getElementById('withdrawWarning').classList.add('hidden');
            validateWithdrawForm();
            document.getElementById('withdrawModal').classList.remove('hidden');
        }

        function closeWithdrawModal() {
            document.getElementById('withdrawModal').classList.add('hidden');
        }

        function handleWithdrawInput() {
            const val = parseFloat(document.getElementById('withdrawAmountInput').value) || 0;
            const warningEl = document.getElementById('withdrawWarning');
            if (val > userWalletBalance) {
                warningEl.classList.remove('hidden');
            } else {
                warningEl.classList.add('hidden');
            }
            validateWithdrawForm();
        }

        function setMaxWithdraw() {
            document.getElementById('withdrawAmountInput').value = userWalletBalance;
            handleWithdrawInput();
        }

        function validateWithdrawForm() {
            const amt = parseFloat(document.getElementById('withdrawAmountInput').value) || 0;
            const address = document.getElementById('withdrawAddressInput').value.trim();
            const btn = document.getElementById('previewWithdrawBtn');

            if (amt > 0 && amt <= userWalletBalance && address.length > 5) {
                btn.disabled = false;
                btn.className = "w-full py-3 rounded-xl bg-primary hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-all shadow-lg cursor-pointer mt-1";
            } else {
                btn.disabled = true;
                btn.className = "w-full py-3 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs transition-all cursor-not-allowed mt-1";
            }
        }

        function pasteWithdrawAddress() {
            if (navigator.clipboard && navigator.clipboard.readText) {
                navigator.clipboard.readText().then(text => {
                    document.getElementById('withdrawAddressInput').value = text.trim();
                    validateWithdrawForm();
                }).catch(() => {
                    alert('Please paste address manually.');
                });
            } else {
                alert('Clipboard access not supported.');
            }
        }

        function submitWithdrawal() {
            const amt = parseFloat(document.getElementById('withdrawAmountInput').value) || 0;
            if (amt <= 0 || amt > userWalletBalance) return;
            alert(`Withdrawal of ${amt} USDT submitted successfully!`);
            closeWithdrawModal();
        }

        function openCreateAdModal() {
            document.getElementById('createAdModal').classList.remove('hidden');
        }

        function closeCreateAdModal() {
            document.getElementById('createAdModal').classList.add('hidden');
        }

        function submitNewAd() {
            const type = document.getElementById('newAdType').value;
            const price = parseFloat(document.getElementById('newAdPrice').value) || 189.00;
            const amount = parseFloat(document.getElementById('newAdAmount').value) || 50.00;

            myAds.push({
                id: Date.now(),
                type,
                price,
                amount,
                status: 'Active'
            });

            closeCreateAdModal();
            renderMyAds();
        }

        function renderMyAds() {
            const container = document.getElementById('myAdsListContainer');
            if (!container) return;
            container.innerHTML = '';

            if (myAds.length === 0) {
                container.innerHTML = `<div class="bg-cardbg p-8 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">No active ads created yet.</div>`;
                return;
            }

            myAds.forEach(ad => {
                let badgeColor = ad.type === 'buy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400';
                container.innerHTML += `
                    <div class="bg-cardbg p-4 rounded-2xl border border-slate-800 space-y-3 text-xs shadow-md">
                        <div class="flex justify-between items-center border-b border-slate-800 pb-2">
                            <div class="flex items-center space-x-2">
                                <span class="px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase ${badgeColor}">${ad.type} USDT</span>
                                <span class="text-white font-bold text-sm">${ad.price.toFixed(2)} ETB</span>
                            </div>
                            <button onclick="openDeleteAdModal(${ad.id})" class="text-slate-400 hover:text-rose-400 p-1 cursor-pointer">Delete</button>
                        </div>
                        <div class="grid grid-cols-2 gap-2 pt-1">
                            <div>
                                <span class="text-slate-500 text-[10px] uppercase block tracking-wider font-medium">Total Amount</span>
                                <span class="text-white font-bold text-sm">${ad.amount} USDT</span>
                            </div>
                            <div>
                                <span class="text-slate-500 text-[10px] uppercase block tracking-wider font-medium">Status</span>
                                <span class="text-primary font-bold text-sm">${ad.status}</span>
                            </div>
                        </div>
                    </div>`;
            });
        }

        function openDeleteAdModal(id) {
            adToDeleteId = id;
            document.getElementById('deleteAdModal').classList.remove('hidden');
        }

        function closeDeleteAdModal() {
            adToDeleteId = null;
            document.getElementById('deleteAdModal').classList.add('hidden');
        }

        function confirmDeleteAd() {
            myAds = myAds.filter(ad => ad.id !== adToDeleteId);
            closeDeleteAdModal();
            renderMyAds();
        }

        function sendChatMessage() {
            const input = document.getElementById('chatInput');
            const msg = input.value.trim();
            if (!msg) return;

            const chatContainer = document.getElementById('chatMessages');
            chatContainer.innerHTML += `
                <div class="bg-primary/20 border border-primary/30 p-2 rounded-lg max-w-[80%] ml-auto text-slate-200">
                    <span class="font-bold text-primary block text-[10px]">Melaku Awoke (You)</span>
                    ${escapeHTML(msg)}
                </div>
            `;
            input.value = '';
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        function escapeHTML(str) {
            return str.replace(/[&<>'"]/g, 
                tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
            );
        }

        // Initialize App
        window.onload = function() {
            startOrderTimers();
            renderMarketplace();
        };
    </script>
</body>
</html>
