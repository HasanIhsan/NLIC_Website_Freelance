 
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
        const target = this.getAttribute('data-target');
        
        document.querySelectorAll('.content').forEach(content => {
            content.classList.remove('active');
        });
        
        document.getElementById(target).classList.add('active');
    });
});


document.addEventListener('DOMContentLoaded', () => {
    // Fetch jobs and populate job dropdown
    fetch('http://localhost:3100/api/jobs')
      .then(response => response.json())
      .then(data => {
        const jobSelect = document.getElementById('jobId');
        const ejobSelect = document.getElementById('ejobId');
        const jobFilter = document.getElementById('jobFilter');
        data.forEach(job => {
          const option = document.createElement('option');
          option.value = job._id;
          option.textContent = job.name;
          jobSelect.appendChild(option);

          const filterOption = option.cloneNode(true);
          jobFilter.appendChild(filterOption);

          const ejobfilter = option.cloneNode(true);
          ejobSelect.appendChild(ejobfilter);
        });
        populateJobsList(data);
      });

    // Fetch people based on job filter
    document.getElementById('jobFilter').addEventListener('change', (event) => {
      const jobId = event.target.value;
      fetch(`http://localhost:3100/api/people?jobId=${jobId}`)
        .then(response => response.json())
        .then(data => populatePeopleList(data));
    });

    //fetch all people
    fetch('http://localhost:3100/api/peoples') 
        .then(response => response.json())
        .then(data => {
            const peopleFilter = document.getElementById('peopleFilter');
            const editPeopleFilter = document.getElementById('editPeopleFilter');
            data.forEach(person => {
                const option = document.createElement('option');
                option.value = person._id;
                option.textContent = person.personName;
                peopleFilter.appendChild(option)
                
                const editpeople = option.cloneNode(true);
                editPeopleFilter.appendChild(editpeople);
                
            });
            
        });

    //fetch people based on job filter
    document.getElementById('peopleFilter').addEventListener('change', (event) => {
        const personId = event.target.value;
        fetch(`http://localhost:3100/api/reviews?personId=${personId}`)
        .then(response => response.json())
        .then(data => populateReviewList(data));

    })


    //update edit from when a person is selected
    document.getElementById('editPeopleFilter').addEventListener('change', (event) => {
        const personId = event.target.value;
        fetch(`http://localhost:3100/api/person/${personId}`)
          .then(response => response.json())
          .then(person => {
            console.log(person);
            document.getElementById('epersonName').value = person[0].personName;
            document.getElementById('ejobId').value = person[0].jobId;
            document.getElementById('epersonDescription').value = person[0].personDescription;
            document.getElementById('econtactNumber').value = person[0].contactNumber;
            document.getElementById('eworkLocation').value = person[0].workLocation;
            document.getElementById('ememberShipNum').value = person[0].memberShipNum ? person[0].memberShipNum : 0;

            // If you need to handle the image, you might set up a preview or something similar
            //document.getElementById('imagePreview').src = `path_to_images/${person[0].imageFile}`;
          });
      });

      //update person
      document.getElementById('completeEditButton').addEventListener('click', event => {
        event.preventDefault();  // Prevent the default form submission behavior
    
        const personId = document.getElementById('editPeopleFilter').value;  // Get the selected person's ID
    
        const formData = new FormData();
        formData.append('personName', document.getElementById('epersonName').value);
        formData.append('jobId', document.getElementById('ejobId').value);
        formData.append('personDescription', document.getElementById('epersonDescription').value);
        formData.append('contactNumber', document.getElementById('econtactNumber').value);
        formData.append('workLocation', document.getElementById('eworkLocation').value);
        formData.append('memberShipNum', document.getElementById('ememberShipNum').value);

        const imageFile = document.getElementById('eimageFile').files[0];
        if (imageFile) {
            formData.append('imageFile', imageFile);
        }
    
        // Send the updated data to the server
        fetch(`http://localhost:3100/api/person/${personId}`, {
            method: 'PUT',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            alert('Person updated successfully');
            location.reload();  // Reload the page to reflect the changes
        })
        .catch(error => console.error('Error:', error));
    });
    
    // Handle job form submission
    document.getElementById('jobForm').addEventListener('submit', event => {
      event.preventDefault();
      const jobName = document.getElementById('jobName').value.toLowerCase();
      fetch('http://localhost:3100/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: jobName })
      })
        .then(response => response.json())
        .then(data => {
          alert('Job added successfully');
          location.reload();
        })
        .catch(error => console.error('Error:', error));
    });

    // Handle people form submission
    document.getElementById('peopleForm').addEventListener('submit', event => {
      event.preventDefault();
      const formData = new FormData(event.target);
      fetch('http://localhost:3100/api/people', {
        method: 'POST',
        body: formData
      })
        .then(response => response.json())
        .then(data => {
          alert('Person added successfully');
          location.reload();
        })
        .catch(error => console.error('Error:', error));
    });

    // Delete selected review
    document.getElementById('deleteReviewButton').addEventListener('click', () => {
      const selectedReviewId = document.querySelector('input[name="review"]:checked')?.value;
      if (selectedReviewId) {
        fetch(`http://localhost:3100/api/reviews/${selectedReviewId}`, { method: 'DELETE' })
          .then(response => response.json())
          .then(() => {
            alert('Review deleted successfully');
            location.reload();
          })
          .catch(error => console.error('Error:', error));
      } else {
        alert('Please select a review to delete');
      }
    });

       // Delete selected job
       document.getElementById('deleteJobButton').addEventListener('click', () => {
        const selectedJobId = document.querySelector('input[name="job"]:checked')?.value;
        if (selectedJobId) {
          fetch(`http://localhost:3100/api/jobs/${selectedJobId}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(() => {
              alert('Job deleted successfully');
              location.reload();
            })
            .catch(error => console.error('Error:', error));
        } else {
          alert('Please select a job to delete');
        }
      });

    // Delete selected people
    document.getElementById('deletePeopleButton').addEventListener('click', () => {
      const selectedPeople = Array.from(document.querySelectorAll('input[name="person"]:checked'))
        .map(input => input.value);
      if (selectedPeople.length > 0) {
        fetch('http://localhost:3100/api/people', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedPeople })
        })
          .then(response => response.json())
          .then(() => {
            alert('People deleted successfully');
            location.reload();
          })
          .catch(error => console.error('Error:', error));
      } else {
        alert('Please select people to delete');
      }
    });

    // Populate jobs list
    function populateJobsList(jobs) {
      const jobsList = document.getElementById('jobsList');
      jobsList.innerHTML = '';
      jobs.forEach(job => {
        const div = document.createElement('div');
        div.innerHTML = `
          <input type="radio" name="job" value="${job._id}" id="job-${job._id}">
          <label for="job-${job._id}">${job.name}</label>
        `;
        jobsList.appendChild(div);
      });
    }

    // Populate people list
    function populatePeopleList(people) {
      const peopleList = document.getElementById('peopleList');
      peopleList.innerHTML = '';
      people.forEach(person => {
        const div = document.createElement('div');
        div.innerHTML = `
          <input type="radio" name="person" value="${person._id}" id="person-${person._id}">
          <label for="person-${person._id}">${person.personName}</label>
        `;
        peopleList.appendChild(div);
      });
    }

    function populateReviewList(reviews) {
        const reviewsList = document.getElementById('reviewList');
      reviewsList.innerHTML = '';
      reviews.forEach(review => {
        const div = document.createElement('div');
        div.innerHTML = `
          <input type="radio" name="review" value="${review._id}" id="person-${review._id}">
          <label for="review-${review._id}">${review.review} - ${review.rating}</label>
        `;
        reviewsList.appendChild(div);
      });
    }
  });