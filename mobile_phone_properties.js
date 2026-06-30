import { world, system, ItemStack } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";


const TRIGGER_ITEMS = [
    "nirvana:burner_phone",

];
const UI = {
    header: "§e§l—§6§l—§e§l—§r §f§lDEVICE§r §e§l—§6§l—§e§l—§r",
    line: "\n§7§m--------------------------§r\n"
};
function itemToData(item) {
    if (!item) return null;
    return { typeId: item.typeId, amount: item.amount, nameTag: item.nameTag };
}
function dataToItem(data) {
    if (!data) return null;
    const item = new ItemStack(data.typeId, data.amount);
    if (data.nameTag) item.nameTag = data.nameTag;
    return item;
}
world.afterEvents.itemUse.subscribe((event) => {
    const player = event.source;
    if (TRIGGER_ITEMS.includes(event.itemStack.typeId)) {
        system.run(() => {
            player.playSound("ui.button.click");
            showMainMenu(player);
        });
    }
});
world.afterEvents.playerSpawn.subscribe((event) => {
    const player = event.player;
    if (event.initialSpawn) {
        const globalMail = JSON.parse(world.getDynamicProperty("global_mailbox") || "{}");
        if (globalMail[player.name]) {
            const currentMsgs = JSON.parse(player.getDynamicProperty("messages") || "[]");
            const incoming = globalMail[player.name].map(m => ({ ...m, read: false }));
            player.setDynamicProperty("messages", JSON.stringify([...currentMsgs, ...incoming]));
            system.runTimeout(() => {
                player.sendMessage(`§e§lPHONE§r §fYou have §a${incoming.length}§f new messages!`);
                player.playSound("random.levelup");
            }, 100);
            delete globalMail[player.name];
            world.setDynamicProperty("global_mailbox", JSON.stringify(globalMail));
        }
    }
});
function showMainMenu(player) {
    const msgs = JSON.parse(player.getDynamicProperty("messages") || "[]");
    const reqs = JSON.parse(player.getDynamicProperty("requests") || "[]");
    const unread = msgs.filter(m => !m.read).length;
    new ActionFormData()
        .title(UI.header)
        .button(`§lMESSAGES§r\n${unread > 0 ? "§a" : "§7"}(${unread} Unread)`, "textures/ui/icon_bell")
        .button(`§lSOCIAL§r\n${reqs.length > 0 ? "§e" : "§7"}(${reqs.length} New)`, "textures/ui/World")
        .button(`§6§lITEM TRANSFER§r\n§7Cost: 1 XP Level`, "textures/ui/inventory_icon")
        .button(`§lCOMPOSE§r\n§7Text Only`, "textures/items/feather")
        .show(player).then(res => {
            if (res.canceled) return;
            system.run(() => {
                player.playSound("ui.button.click");
                if (res.selection === 0) showInbox(player);
                if (res.selection === 1) showSocialMenu(player);
                if (res.selection === 2) showItemTransferApp(player);
                if (res.selection === 3) showSendMenu(player);
            });
        });
}
function showItemTransferApp(player) {
    const friends = JSON.parse(player.getDynamicProperty("friends") || "[]");
    if (friends.length === 0) {
        player.sendMessage("§c§l(!)§r §7No friends to send items to.");
        return;
    }
    const container = player.getComponent("inventory").container;
    const validItems = [];
    for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i);
        if (item && !TRIGGER_ITEMS.includes(item.typeId)) {
            validItems.push({
                slot: i,
                name: (item.nameTag || item.typeId.split(":")[1].replace(/_/g, " ")),
                amount: item.amount,
                typeId: item.typeId
            });
        }
    }
    if (validItems.length === 0) {
        player.sendMessage("§c§l(!)§r §7Your inventory contains no transferable items.");
        return;
    }
    const itemNames = validItems.map(i => `${i.name} (x${i.amount})`);
    new ModalFormData()
        .title("§6§lITEM TRANSFER")
        .dropdown("§7Target Friend:", friends)
        .dropdown("§7Select Item from Inventory:", itemNames)
        .label(`§7Cost: §e1 XP Level\n\n§8Note: Selected item will be moved to friend's inbox.`)
        .show(player).then(res => {
            if (res.canceled) return;
            
            const targetName = friends[res.formValues[0]];
            const selectedData = validItems[res.formValues[1]];
            const itemToTransfer = container.getItem(selectedData.slot);
            if (!itemToTransfer || itemToTransfer.typeId !== selectedData.typeId) {
                player.sendMessage("§c§l(!)§r §7Item no longer in inventory.");
                return;
            }
            if (player.level < 1) {
                player.sendMessage("§c§l(!)§r §7Not enough XP.");
                return;
            }
            const packageObj = {
                from: player.name,
                body: `§e[Sent Item: ${selectedData.name}]`,
                date: new Date().toLocaleTimeString(),
                read: false,
                item: itemToData(itemToTransfer)
            };
            player.addLevels(-1);
            container.setItem(selectedData.slot, undefined);
            
            deliverMessage(player, targetName, packageObj);
        });
}
function deliverMessage(sender, targetName, msgObj) {
    const target = world.getAllPlayers().find(p => p.name === targetName);
    if (target) {
        const data = JSON.parse(target.getDynamicProperty("messages") || "[]");
        data.push(msgObj);
        target.setDynamicProperty("messages", JSON.stringify(data));
        sender.sendMessage(`§a§lSENT§r §7Item delivered to §f${targetName}§7.`);
        sender.playSound("note.pling");
        target.playSound("random.levelup");
    } else {
        const globalMail = JSON.parse(world.getDynamicProperty("global_mailbox") || "{}");
        if (!globalMail[targetName]) globalMail[targetName] = [];
        globalMail[targetName].push(msgObj);
        world.setDynamicProperty("global_mailbox", JSON.stringify(globalMail));
        sender.sendMessage(`§e§lSENT§r §7${targetName} is offline. Item stored.`);
        sender.playSound("note.pling");
    }
}
function showSendMenu(player) {
    const friends = JSON.parse(player.getDynamicProperty("friends") || "[]");
    if (friends.length === 0) return player.sendMessage("§c§l(!)§r §7No contacts.");
    new ModalFormData()
        .title("§lNEW MESSAGE")
        .dropdown("§7Contact:", friends)
        .textField("§7Message:", "Type here...")
        .show(player).then(res => {
            if (res.canceled || !res.formValues[1]) return;
            deliverMessage(player, friends[res.formValues[0]], {
                from: player.name,
                body: res.formValues[1],
                date: new Date().toLocaleTimeString(),
                read: false,
                item: null
            });
        });
}
function showInbox(player) {
    const msgs = JSON.parse(player.getDynamicProperty("messages") || "[]");
    if (msgs.length === 0) {
        new ActionFormData().title("§lINBOX").body("§7Empty.").button("§l« BACK").show(player).then(() => {
            system.run(() => showMainMenu(player));
        });
        return;
    }
    const form = new ActionFormData().title("§lINBOX");
    msgs.forEach(m => form.button(`${m.read ? "§8" : "§6● "}§l${m.from}§r\n§8${m.item ? "§e[ITEM] " : ""}${m.date}`));
    form.button("§l« BACK");
    form.show(player).then(res => {
        if (res.canceled || res.selection === msgs.length) {
            system.run(() => showMainMenu(player));
            return;
        }     
        const idx = res.selection;
        msgs[idx].read = true;
        player.setDynamicProperty("messages", JSON.stringify(msgs));
        const m = msgs[idx];
        const body = `${UI.line}§7From: §f${m.from}\n§7Date: §f${m.date}\n\n§f${m.body}${m.item ? `\n\n§e§lATTACHMENT:§r\n§f${m.item.typeId.split(":")[1]}` : ""}${UI.line}`;      
        const msgForm = new ActionFormData().title("§lVIEW MESSAGE").body(body);
        if (m.item) msgForm.button("§6§lCLAIM ITEM");
        msgForm.button("§4§lDELETE");
        msgForm.button("§l« BACK");
        msgForm.show(player).then(sub => {
            if (sub.canceled) return;
            system.run(() => {
                if (m.item && sub.selection === 0) {
                    const inv = player.getComponent("inventory").container;
                    if (inv.emptySlotsCount > 0) {
                        inv.addItem(dataToItem(m.item));
                        msgs[idx].item = null;
                        player.setDynamicProperty("messages", JSON.stringify(msgs));
                        player.sendMessage("§aItem claimed!");
                    } else player.sendMessage("§cInventory full!");
                    showInbox(player);
                } else if ((m.item && sub.selection === 1) || (!m.item && sub.selection === 0)) {
                    if (m.item) {
                        player.sendMessage("§cClaim item first!");
                        showInbox(player);
                    } else {
                        msgs.splice(idx, 1);
                        player.setDynamicProperty("messages", JSON.stringify(msgs));
                        showInbox(player);
                    }
                } else {
                    showInbox(player);
                }
            });
        });
    });
}
function showSocialMenu(player) {
    const reqs = JSON.parse(player.getDynamicProperty("requests") || "[]");
    new ActionFormData()
        .title("§lSOCIAL")
        .button(`§lREQUESTS (${reqs.length})`)
        .button("§lCONTACTS")
        .button("§lADD FRIEND")
        .button("§l« BACK")
        .show(player).then(res => {
            if (res.canceled || res.selection === 3) {
                system.run(() => showMainMenu(player));
                return;
            }
            system.run(() => {
                if (res.selection === 0) showRequestsMenu(player);
                if (res.selection === 1) showContactsList(player);
                if (res.selection === 2) showAddFriendMenu(player);
            });
        });
}
function showContactsList(player) {
    const friends = JSON.parse(player.getDynamicProperty("friends") || "[]");
    const form = new ActionFormData().title("§lCONTACTS");
    friends.forEach(f => form.button(`§l${f}`));
    form.button("§l« BACK");
    form.show(player).then(res => {
        if (res.canceled || res.selection === friends.length) {
            system.run(() => showSocialMenu(player));
            return;
        }
        const name = friends[res.selection];
        new ActionFormData().title(name).button("§cREMOVE").button("§l« BACK").show(player).then(sub => {
            system.run(() => {
                if (sub.selection === 0) {
                    const updated = friends.filter(n => n !== name);
                    player.setDynamicProperty("friends", JSON.stringify(updated));
                }
                showContactsList(player);
            });
        });
    });
}
function showAddFriendMenu(player) {
    const all = world.getAllPlayers().filter(p => p.name !== player.name);
    if (all.length === 0) return player.sendMessage("§cNo one online.");
    const names = all.map(p => p.name);
    new ModalFormData().title("§lADD").dropdown("Player:", names).show(player).then(res => {
        if (res.canceled) return;
        const target = all[res.formValues[0]];
        const treqs = JSON.parse(target.getDynamicProperty("requests") || "[]");
        if (!treqs.includes(player.name)) {
            treqs.push(player.name);
            target.setDynamicProperty("requests", JSON.stringify(treqs));
            player.sendMessage("§aRequest sent.");
        }
    });
}
function showRequestsMenu(player) {
    const reqs = JSON.parse(player.getDynamicProperty("requests") || "[]");
    if (reqs.length === 0) {
        system.run(() => showSocialMenu(player));
        return;
    }
    const form = new ActionFormData().title("§lREQUESTS");
    reqs.forEach(r => form.button(`Accept ${r}`));
    form.show(player).then(res => {
        if (res.canceled) {
            system.run(() => showSocialMenu(player));
            return;
        }
        const name = reqs[res.selection];
        let friends = JSON.parse(player.getDynamicProperty("friends") || "[]");
        if (!friends.includes(name)) friends.push(name);
        player.setDynamicProperty("friends", JSON.stringify(friends));
        reqs.splice(res.selection, 1);
        player.setDynamicProperty("requests", JSON.stringify(reqs));
        
        const sender = world.getAllPlayers().find(p => p.name === name);
        if (sender) {
            let sf = JSON.parse(sender.getDynamicProperty("friends") || "[]");
            if (!sf.includes(player.name)) sf.push(player.name);
            sender.setDynamicProperty("friends", JSON.stringify(sf));
        }
        system.run(() => showRequestsMenu(player));
    });
}
system.runInterval(() => {
    for (const p of world.getAllPlayers()) {
        const msgs = JSON.parse(p.getDynamicProperty("messages") || "[]");
        const unread = msgs.filter(m => !m.read).length;
        if (unread > 0) p.onScreenDisplay.setActionBar(`§e§l✉§r You have §e${unread}§r unread message(s)`);
    }
}, 40);