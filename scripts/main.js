const butcherTiers = [{
    score: 12,
    description: "+1 die to intimidate civilians"
},{
    score: 25,
    description: "Checks to positively persuade others are done with –2 die"
},{
    score: 50,
    description: "You are always eager for a fight. Roll initiative twice and take the higher number"
},{
    score: 75,
    description: "When performing a Coup de Grace, you don’t give a clean death but hack and savage the corpse. Roll an intimidation check vs remaining enemies’ Will save. They will flee on failure"
},{
    score: 100,
    description: "When an enemy in sight is Broken, must make WITS save or disregard all other objectives until you have killed the downed opponent (or the opponent dies from other means)"
},{
    score: 125,
    description: "You are always welcome at the campfire of slavers, as you are mistaken to be a fellow brother"
},{
    score: 150,
    description: "All interactions with good-aligned or civilian beings are treated as though you have zero Empathy, unless the effect is intimidation"
},{
    score: 175,
    description: "You are never welcome in towns or castles, and can only enter heavily disguised. You are a known and condemned killer"
},{
    score: 200,
    description: "An order of knights align with the sole purpose of finding and utterly destroying you – convinced that you are a powerful demon spoken of in ancient prophesies that heralds the end of the world"
}];

const generateButcherTable = (actor) => {
    const currentButcherScore = actor.getFlag("fl-butcher-score", "current-score") ?? 0;
    let butcherTierHTML = '';
    for(const tier of butcherTiers) {
        const metTier = currentButcherScore >= tier.score;
        butcherTierHTML += `
            <div class="butcher-tier-row${(metTier)? ' butcher-tier-met': ''}">
                <div class="butcher-tier-score">${tier.score}</div>
                <div class="butcher-tier-description">${tier.description}</div>
            </div>
        `;
    }
    return `
        <div class="butcher-score-container">
            Butcher: <span class="current-butcher-score">${currentButcherScore}</span><i class="fa-solid fa-dice-d20"></i>
        </div>
        <div class="butcher-tiers">
            <div class="butcher-tier-header">
                <div class="butcher-tier-score">Score</div>
                <div class="butcher-tier-description">Effect</div>
            </div>
            ${butcherTierHTML}
        </div>
    `;
}

const updateScorePrompt = async () => {
    const newScore = await Dialog.prompt({
        title: `Update Butcher Score`,
        content: `
            <h1>New Butcher Score</h1>
            <input type="number" min="0" id="new-butcher-score" />
        `,
        label: `Update Butcher Score`,
        callback: (html) => parseInt(html.find('input').val()),
        rejectClose: false,
  });

  return newScore;
}

Hooks.on("renderForbiddenLandsCharacterSheet", async (sheet, $html) => {
    const html = $html[0];

    html.querySelector('.sheet-tabs.tabs[data-group="primary"]').insertAdjacentHTML('beforeend','<b class="tab-item" data-tab="butcher">butcher</b>');
    html.querySelector('.sheet-body').insertAdjacentHTML('beforeend',`
        <div class="tab" data-group="primary" data-tab="butcher">
            ${generateButcherTable(sheet.actor)}
        </div>
    `);

    html.querySelector('div.tab[data-tab="butcher"] i.fa-dice-d20').addEventListener('click', async (event) => {
        const empathyRoll = await sheet.rollAttribute('empathy');
        let rollFormula = (empathyRoll.roll.successCount > 0)? '1d6' : '1d12';
        let butcherRoll = await Roll.create(rollFormula).evaluate({async: true});


        const butcherRollTotal = butcherRoll._total;
        const newButcherScore = (sheet.actor.getFlag("fl-butcher-score", "current-score") ?? 0) + butcherRollTotal;
        butcherRoll.toMessage();
        await sheet.actor.setFlag("fl-butcher-score", "current-score", newButcherScore);
    });

    html.querySelector('.current-butcher-score').addEventListener('click', async (event) => {
        let newButcherScore = await updateScorePrompt();
        if(newButcherScore !== null) {
            if(newButcherScore < 0) newButcherScore = 0;
            await sheet.actor.setFlag("fl-butcher-score", "current-score", newButcherScore);
        }
    });
})