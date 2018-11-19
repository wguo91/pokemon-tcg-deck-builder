"use strict";
document.addEventListener("DOMContentLoaded", () => {
  const USER_KEY = "a297f552f5409f003fa4edb6fe0f8419";
  let baseUrl = "https://api.pokemontcg.io/v1/";
  let baseUrlCard = "https://api.pokemontcg.io/v1/cards/";

  // construct api call
  function constructApiCall(baseUrl, searchTerm, requestType) {
    return baseUrl + requestType + "/?name=" + searchTerm;
  };

  // refreshes the card list e.g. after a search query
  function refreshCardList(cards) {
    let pokemonList = document.getElementById("pokemon-list");
    while (pokemonList.lastChild) {
      // using lastChild is more efficient
      pokemonList.removeChild(pokemonList.lastChild);
    }
    constructCardList(cards);
  };

  // loads the first 100 cards in the default list
  function loadDefaultListOfCards() {
    const xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", function() {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          constructCardList(JSON.parse(xhr.responseText).cards);
          // remove the overlay
          let loadOverlay = document.getElementById("load-overlay");
          fadeOutElement(loadOverlay);
        } else {
          console.error("failure: " + xhr.responseText);
        }
      }
    });
    xhr.open("GET", baseUrlCard);
    xhr.send();
  }

  function fadeOutElement(target) {
    let fadeEffect = setInterval(() => {
      if (!target.style.opacity) {
        target.style.opacity = 1;
      }
      if (target.style.opacity > 0) {
        target.style.opacity -= 0.2;
      } else {
        clearInterval(fadeEffect);
        target.style.display = "none";
      }
    }, 100);
  }

  // renders the card list based on the cards object
  function constructCardList(cards) {
    // renders the default list of 100 items
    let ul = document.createElement("ul");
    cards.forEach(function(currentCard) {
      // add the plus icon
      let image = document.createElement("img");
      image.src = "images/plus.png";
      image.alt = "Add " + currentCard.name + " to current deck";
      let figure = document.createElement("figure");
      figure.appendChild(image);

      let info = currentCard.name + " [" + currentCard.set + "]"
      let para = document.createElement("p");
      para.appendChild(document.createTextNode(info));

      let li = document.createElement("li");
      li.setAttribute("data-id", currentCard.id);
      li.appendChild(para);
      li.appendChild(figure);
      ul.appendChild(li);
    });

    // use event delegation to avoid putting an event listener on every single list item // show more detailed information about a card
    ul.addEventListener("click", function(event) {
      // check if add button was clicked
      // find the closest li ancestor if name is clicked
      let id = event.target.closest("li").getAttribute("data-id");
      fetchCardDataById(id)
        .then(cardData => {
          if (event.target.tagName === "IMG") {
            addToDeckView(cardData);
          } else {
            loadModal(cardData);
          }
        })
        .catch(error => console.error("FAILURE ON PROMISE error=" + error));
    });
    document.getElementById("pokemon-list").appendChild(ul);
  };

  function addToDeckView(card) {
    let cardImage = createCardImage(card.imageUrl, card.name);
    cardImage.classList.add("deck-view-image");
    // determine overlay color
    let overlayColor = determineOverlayColor(card.types);

    // add an overlay
    let cardOverlay = document.createElement("div");
    cardOverlay.classList.add("card-overlay");
    cardOverlay.style.backgroundColor = overlayColor + "66";

    // overlay text
    let cardOverlayDetails = document.createElement("p");
    cardOverlayDetails.appendChild(document.createTextNode(card.name));
    cardOverlayDetails.style.backgroundColor = overlayColor;

    // add a removal button
    let image = document.createElement("img");
    image.src = "images/minus.png";
    image.alt = "Remove " + card.name + " from current deck";
    let figure = document.createElement("figure");
    figure.id = "figure_" + new Date().getTime().toString();
    let figCaption = document.createElement("figcaption");
    figCaption.appendChild(document.createTextNode("Remove"));

    // if non-Pokemon card, border and font should be black
    if (card.supertype.startsWith("P")) {
      cardOverlayDetails.style.color = "#FFFFFF";
      cardOverlay.style.border = "1px solid " + overlayColor;
      figCaption.style.color = "#FFFFFF";
    } else {
      cardOverlayDetails.style.color = "#000000";
      cardOverlay.style.border = "1px solid " + "#000000";
      figCaption.style.color = "#000000";
    }
    cardOverlay.appendChild(cardOverlayDetails);
    figure.appendChild(image);
    figure.appendChild(figCaption);
    cardOverlay.appendChild(figure);

    cardImage.appendChild(cardOverlay);
    let deckView = document.getElementById("deck-view");
    deckView.appendChild(cardImage);
    // add event listener to remove cards from the deck view
    deckView.addEventListener("click", (event) => {
      if (event.target.tagName === "IMG") {
        event.target.closest(".card-image").remove();
      }
    });

    // update counter
    let deckCounter = document.getElementById("deck-counter");
    let count = parseInt(deckCounter.dataset.counter, 10) + 1;
    deckCounter.dataset.counter = count.toString();
    deckCounter.innerHTML = count.toString();
  };

  function determineOverlayColor(types) {
    // if pokemon, choose color based on type, otherwise return default color (white)
    if (types) {
      let type = types[0].toLowerCase();
      switch(type) {
        case "colorless":
          return "#AFA97A";
        case "darkness":
          return "#16325A";
        case "dragon":
          return "#C9AE26";
        case "fairy":
          return "#FF1697";
        case "fighting":
          return "#FF5B00";
        case "fire":
          return "#FF0200";
        case "grass":
          return "#5ECB1F";
        case "lightning":
          return "#FFED01";
        case "metal":
          return "#6F858D";
        case "psychic":
          return "#833B8B";
        case "water":
          return "#00A8EA";
        default:
          return "#FFFFFF";
      }
    }
    return "#FFFFFF";
  }
  // makes an AJAX call to fetch a card
  function fetchCardDataById(id) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", baseUrlCard + id);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText).card);
        } else {
          reject(xhr.statusText);
        }
      }
      xhr.onerror = () => reject(xhr.statusText);
      xhr.send();
    });
  };

  // create HTML element for the card type
  function createCardTypeElement(typeName, typeValue) {
    let cardType = document.createElement("p");
    cardType.appendChild(document.createTextNode("Card Type: " + typeName + " (" + typeValue + ")"));
    return cardType;
  }

  // load modal when a user clicks on a card
  function loadModal(card) {
    let modalContainer = document.createElement("div");
    modalContainer.classList.add("modal-container");
    modalContainer.addEventListener("click", event => {
      // when the user clicks anywhere outside the modal, close the modal
      if (event.target === modalContainer) modalContainer.style.display = "none";
    });

    let modal = document.createElement("section");
    modal.id = "modal";

    // cardInfo encompasses the card-header card-details
    let cardInfo = document.createElement("div");
    cardInfo.id = "card-info";

    let cardDetails = document.createElement("section");
    cardDetails.id = "card-details";

    // create header
    let header = document.createElement("header");
    header.id = "card-header";
    let cardName = document.createElement("h1");
    cardName.appendChild(document.createTextNode(card.name));
    header.appendChild(cardName);

    // choose appropriate background image for modal
    if (card.types) {
      modal.style.backgroundImage = "url('images/" + card.types[0].toLowerCase() + ".png')";
    } else if (card.supertype.startsWith("T")) {
      modal.style.backgroundImage = "url('images/trainer.png')";
    } else if (card.supertype.startsWith("E") && card.subtype !== "Special") {
      let cardName = parseEnergyName(card.name);
      modal.style.backgroundImage = "url('images/" + cardName + ".png')";
    } else {
      // default is trainer background for now
      modal.style.backgroundImage = "url('images/trainer.png')";
    }
    modal.style.backgroundPosition = "center";
    modal.style.backgroundAttachment = "fixed";

    if (card.supertype.startsWith("P")) {
      // card type
      cardDetails.appendChild(createCardTypeElement("Pokemon", card.subtype));

      // pokemon type
      let pokemonType = document.createElement("p");
      pokemonType.appendChild(document.createTextNode("Pokemon Type: " + card.types[0]));
      cardDetails.appendChild(pokemonType);

      // pokemon number
      let pokedexNumber = document.createElement("p");
      pokedexNumber.appendChild(document.createTextNode("National Pokedex Number: #" + card.nationalPokedexNumber));
      cardDetails.appendChild(pokedexNumber);

      // hp
      let hp = document.createElement("p");
      hp.appendChild(document.createTextNode("HP: " + card.hp));
      cardDetails.appendChild(hp);

      // pokepower
      if (card.ability) {
        let pokePower = createAbilityElement(card.ability);
        cardDetails.append(pokePower);
      }
      // attacks
      let allAttackDetails = createAttackDetails(card);
      cardDetails.append(allAttackDetails);

      // retreat cost and weaknesses
      let otherDetails = createOtherDetails(card);
      cardDetails.append(otherDetails);
    } else if (card.supertype.startsWith("T")) {
      // card type
      cardDetails.append(createCardTypeElement("Trainer", card.subtype));
      // trainer text
      let trainerText = document.createElement("p");
      trainerText.appendChild(document.createTextNode(card.text));
      cardDetails.append(trainerText);
    } else if (card.supertype.startsWith("E")) {
      // card type
      cardDetails.append(createCardTypeElement("Energy", card.subtype));
    }

    cardInfo.appendChild(header);
    cardInfo.appendChild(cardDetails);

    // place image first, then header, then details
    let cardImage = createCardImage(card.imageUrl, card.name);
    modal.appendChild(cardImage);
    modal.appendChild(cardInfo);
    modalContainer.appendChild(modal);
    document.body.appendChild(modalContainer);
  };

  function parseEnergyName(name) {
    let wordsInName = name.toLowerCase().split(" ");
    const pokemonTypes = ["colorless", "dark", "dragon", "fairy", "fighting", "fire", "grass", "lightning", "metal", "psychic", "water"];
    for (let i = 0; i < wordsInName.length; i++) {
      if (pokemonTypes.indexOf(wordsInName[i]) === -1) continue;
      return wordsInName[i];
    }
    return null;
  };

  // create HTML element for pokepower / pokebody
  function createAbilityElement(cardAbility) {
    let abilityDetails = document.createElement("section");
    abilityDetails.classList.add("ability-details");

    let abilityName = document.createElement("h4");
    let abilityPrefix = "PokéPower";
    if (cardAbility.type.indexOf("Power") !== -1) {
      abilityName.classList.add("pokepower");
    } else {
      abilityName.classList.add("pokebody");
      abilityPrefix = "PokéBody";
    }
    abilityName.appendChild(document.createTextNode(abilityPrefix + ": " + cardAbility.name));

    let abilityText = document.createElement("p");
    abilityText.appendChild(document.createTextNode(cardAbility.text));

    abilityDetails.appendChild(abilityName);
    abilityDetails.appendChild(abilityText)
    return abilityDetails;
  };

  function createAttackDetails(card) {
    let allAttackDetails = document.createElement("section");
    allAttackDetails.classList.add("all-attack-details");
    card.attacks.forEach((currentAttack) => {
      let figure = document.createElement("figure");
      let attackDetails = document.createElement("section");
      attackDetails.classList.add("attack-details");

      // the energy cost, attack name, and damage are in the attack header
      let attackHeader = document.createElement("section");
      attackHeader.classList.add("attack-header");

      // first append energy costs (if any), then append the attack details
      if (currentAttack.cost.length) {
        for (let i = 0; i < currentAttack.cost.length; i++) {
          let costImage = document.createElement("img");
          costImage.classList.add("energy-cost");
          // some Pokemon cards have "free" energy costs...
          if (currentAttack.cost[i] !== "Free") {
            costImage.src = "images/" + currentAttack.cost[i].toLowerCase() + "_energy.png";
            costImage.alt = currentAttack.cost[i].toLowerCase() + " energy icon";
            figure.appendChild(costImage);
          }
        }
        // append all energy icons
        if (figure.hasChildNodes()) {
          attackHeader.appendChild(figure);
        }
      }

      // attack name
      let attackName = document.createElement("h4");
      attackName.appendChild(document.createTextNode(currentAttack.name));
      attackHeader.appendChild(attackName);

      // an attack may not have damage
      if (currentAttack.damage !== "") {
        let damage = document.createElement("h4");
        damage.appendChild(document.createTextNode(currentAttack.damage));
        attackHeader.appendChild(damage);
      }

      let attackText = document.createElement("p");
      attackText.appendChild(document.createTextNode(currentAttack.text));

      attackDetails.appendChild(attackHeader);
      attackDetails.appendChild(attackText);
      allAttackDetails.appendChild(attackDetails);
    });
    return allAttackDetails;
  };

  function createOtherDetails(card) {
    let otherDetails = document.createElement("section");
    otherDetails.classList.add("other-details");
    if (card.weaknesses) {
      otherDetails.appendChild(createWeaknessOrResistance(card.weaknesses, "weakness"));
    }
    if (card.resistances) {
      otherDetails.appendChild(createWeaknessOrResistance(card.resistances, "resistance"));
    }
    if (card.retreatCost) {
      otherDetails.appendChild(createRetreatCost(card.retreatCost));
    }
    return otherDetails;
  };

  function createRetreatCost(retreatCost) {
    let retreatCostSection = document.createElement("section");
    retreatCostSection.classList.add("retreat-cost");
    // retreat cost images
    let retreatCostFigure = document.createElement("figure");
    retreatCost.forEach((energy) => {
      let costImage = document.createElement("img");
      costImage.classList.add("energy-cost-other-details");
      costImage.src = "images/" + energy.toLowerCase() + "_energy.png";
      costImage.alt = energy.toLowerCase() + " energy icon";
      retreatCostFigure.appendChild(costImage);
    });
    let retreatCostText = document.createElement("p");
    retreatCostText.appendChild(document.createTextNode("Retreat Cost: "));
    retreatCostSection.appendChild(retreatCostText);
    retreatCostSection.appendChild(retreatCostFigure);
    return retreatCostSection;
  };
  // detail is either "weakness" or "resistance"
  function createWeaknessOrResistance(data, detail) {
    let dataSection = document.createElement("section");
    dataSection.classList.add(detail);
    // weakness or resistance images
    let detailFigure = document.createElement("figure");
    detailFigure.classList.add("weakness-resistance-figure");

    let detailImage = document.createElement("img");
    detailImage.classList.add("energy-cost-other-details");
    detailImage.src = "images/" + data[0].type.toLowerCase() + "_energy.png";
    detailImage.alt = data[0].type + " energy icon";
    // caption
    let detailFigureCaption = document.createElement("figcaption");
    detailFigureCaption.appendChild(document.createTextNode(data[0].value));

    detailFigure.appendChild(detailImage);
    detailFigure.appendChild(detailFigureCaption);
    // weakness text
    let detailText = document.createElement("p");
    detailText.appendChild(document.createTextNode(detail + ":"));
    dataSection.appendChild(detailText);
    dataSection.appendChild(detailFigure);
    return dataSection;
  };

  function createCardImage(imageUrl, imageName) {
    let figure = document.createElement("figure");
    figure.classList.add("card-image");

    let img = document.createElement("img");
    img.src = imageUrl;
    img.alt = "Pokemon card image of " + imageName;
    figure.appendChild(img)
    return figure;
  }

  loadDefaultListOfCards();
  let form = document.getElementById("pokemon-form");
  form.addEventListener("submit", function(event) {
    event.preventDefault();
    let pokemonInput = document.getElementById("pokemon-input").value;
    let url = constructApiCall(baseUrl, pokemonInput, "cards");
    const xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", function() {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          let jsonObject = JSON.parse(xhr.responseText);
          refreshCardList(jsonObject.cards);
        } else {
          alert("Failure");
        }
      }
    });
    xhr.open("GET", url);
    xhr.setRequestHeader("user-key", USER_KEY);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.send();
  });
});
