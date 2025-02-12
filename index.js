// Making these global so that they can be used in calculate_results.
let data, headers, roles;

const calculate_results = (selectedRoles) => {
  // Remove the header row from the data.
  let results = data.slice(1);

  // Clean up the data by removing single quotes and "(Current)" from every cell.
  data = data.map(row =>
    row.map(item =>
      typeof item === 'string' ? item.replace(/'| ?\(Current\)/g, '') : item
    )
  );

  // Build a dictionary that maps each role (as listed in the header row) to the column indices where that role appears.
  const roleColumns = {};
  data[0].forEach((roleName, index) => {
    if (!roleColumns[roleName]) {
      roleColumns[roleName] = [];
    }
    roleColumns[roleName].push(index);
  });

  // This dictionary will hold the results for each role.
  const finalResults = {};

  // Loop through each role that was detected. Everything should've been added to the dictionary from here.
  for (const role in roles) {
    // Initialize the "final results" dictionary for this role.
    finalResults[role] = {};

    // Check if this role is checked. If it is, we do NOT want a weighted result for it.
    if (selectedRoles.includes(role)) {
      // Use only the first column for this role.
      const colIndex = (roleColumns[role] && roleColumns[role][0]);

      // Loop through each vote (each row after the first column header).
      for (let row = 1; row < data.length; row++) {
        let candidate = data[row][colIndex];

        // Clean the candidate name.
        if (typeof candidate === "string") {
          candidate = candidate.trim().replace(/['"]/g, '');
          if (candidate === "") continue; // Skip blank votes.
        } else {
          continue;
        }

        // Checking to see if the candidate was already added to the final results.
        // If not, add them, then add their votes right afterwards.
        if (!finalResults[role][candidate]) {
          finalResults[role][candidate] = 0;
        }
        finalResults[role][candidate] += 1;
      }
    } 
    
    // If it's not checked, we will compute the WEIGHTED calculation.
    else {
      // Total number of columns for this role.
      const numColumns = roles[role]; 
      const columns = roleColumns[role];
      if (!columns) continue;

      // There are multiple columns for each role, so each column will be iterated through.
      columns.forEach((colIndex, i) => {
        // Weight decreases from the first column downwards.
        const weight = numColumns - i;

        // Iterating through each row.
        for (let row = 1; row < data.length; row++) {
          let candidate = data[row][colIndex];

          // Clean the candidate name, like done before.
          if (typeof candidate === "string") {
            candidate = candidate.trim().replace(/['"]/g, '');
            if (candidate === "") continue;
          } else {
            continue;
          }

          // Checking to see if the candidate was already added to the final results.
          // If not, add them, then add their votes right afterwards.
          if (!finalResults[role][candidate]) {
            finalResults[role][candidate] = 0;
          }
          finalResults[role][candidate] += weight;
        }
      });
    }
  }

  // Once the calculations are done, we'll append it to the "results" ID in the DOM.
  const resultsDiv = document.getElementById('results');
  let htmlOutput = `<h3 style="margin-top: 10px;">Results</h3>`;

  // Iterating through all elements in the dictionary, creating HTML for these results.
  for (const role in finalResults) {
    htmlOutput += `<div style="margin-bottom: 20px; text-align: center;">`;
    htmlOutput += `<h5 style="text-align: center;">${role}</h5>`;
    htmlOutput += `<ul style="text-align: center; margin: auto; width: 25%; padding: center;">`;
    for (const candidate in finalResults[role]) {
      htmlOutput += `<li>${candidate}: ${finalResults[role][candidate]}</li>`;
    }
    htmlOutput += `</ul>`;
    htmlOutput += `</div>`;
  }

  resultsDiv.innerHTML = htmlOutput;
};

// When the user selects a file...
document.getElementById('fileInput').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const content = e.target.result;
      data = content.split("\n");
      // For each row, split on commas and remove the first 6 elements.
      for (let i = 0; i < data.length; ++i) {
        data[i] = data[i].split(",").slice(6);
      }

      // The first row contains the headers.
      headers = data[0];
      for (let i = 0; i < headers.length; ++i) {
        // Split by hyphen, take the first part, and remove extra quotes.
        headers[i] = headers[i].split(" - ")[0].replace(/^"|"$/g, '');
      }
      
      // Build a dictionary with the count of each role.
      roles = {};
      headers.forEach(role => {
        roles[role] = (roles[role] || 0) + 1;
      });
      
      // Create an instruction message for the user.
      const outputField = document.getElementById("outputField");
      const instructions = document.createElement("p");
      instructions.style.marginTop = "5px";
      instructions.textContent = "Which role(s) contains ONE person for it?";
      outputField.prepend(instructions);
      
      // Create checkboxes for each role.
      const optionsContainer = document.getElementById("options");
      // Clear any existing content.
      optionsContainer.innerHTML = "";
      for (const role in roles) {
        const formCheckDiv = document.createElement("div");
        formCheckDiv.classList.add("form-check");

        const inputElement = document.createElement("input");
        inputElement.classList.add("form-check-input");
        inputElement.type = "checkbox";
        inputElement.id = role;
        // Optionally, set a value.
        inputElement.value = role;

        const labelElement = document.createElement("label");
        labelElement.classList.add("form-check-label");
        labelElement.setAttribute("for", role);
        labelElement.textContent = role;

        formCheckDiv.appendChild(inputElement);
        formCheckDiv.appendChild(labelElement);
        optionsContainer.appendChild(formCheckDiv);
      }
      
      // Create the "Calculate Results" button.
      const button = document.createElement("button");
      button.classList.add("btn", "btn-success");
      button.type = "button";
      button.id = "calculateResults";
      button.style.marginTop = "5px";
      button.textContent = "Calculate Results";
      optionsContainer.appendChild(button);
      
      // When the button is clicked, gather the selected roles and run the calculations.
      button.addEventListener('click', function() {
        // Get all checkboxes within the options container.
        const checkboxes = document.querySelectorAll('#options .form-check-input');
        const selectedRoles = [];
        checkboxes.forEach(function(checkbox) {
          if (checkbox.checked) {
            selectedRoles.push(checkbox.id);
          }
        });

        // Call the calculation function with the selected roles.
        calculate_results(selectedRoles);
      });
    };
    // Might not be needed?
    reader.readAsText(file);
  }
});
