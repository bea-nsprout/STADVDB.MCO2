<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

<script lang="ts">
	import Header from '$lib/components/Header.svelte';
    import TrainMap from '$lib/components/TrainMap.svelte';
   
    export let data

    console.log(data.bookings.tickets)


    function seatLabel(car: number, row: number, column: number): string {
	const rowLetter = String.fromCharCode("A".charCodeAt(0) + (row - 1));

	return `${car}-${rowLetter}${column}`;
    }
    
    let cancelledBooking = 0;
    let cancelledID = "";
    let modal: HTMLElement | null = null;

    function openModal(bookingNumber: number, bookingID: string) {
        cancelledBooking = bookingNumber;
        cancelledID = bookingID;
        if (modal) {
            modal.style.display = "block";
        }
    }

async function deleteBooking(bookingID: string) {
    console.log(bookingID)
  const res = await fetch('/api/bookings', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ bookingID }) // send the bookingID in JSON
  });

  if(res.ok){
    location.reload();
  }

  
  if(modal) {
    modal.style.display = "none";
  }
}
</script>
<svelte:window on:click={(event) => {
    if (modal && event.target === modal) {
        modal.style.display = "none";
    }
}}/>
<div> <!--Container Div-->
   <Header/>
   <div class = "flex flex-row gap-x-30">
        <TrainMap/>
        <div class = "mt-20 flex flex-col gap-y-5"> <!-- Name and Bookings List-->
            <div class = "text-3xl font-bold text-[var(--color-accent)]" id ="nameContainer">
                 Bookings For {data.email}
            </div> 
            <div class = "flex flex-col gap-y-5" id = "bookingList"> <!--Bookings List-->
                {#each data.bookings as booking, i}
                <div class = "Booking"> <!--Booking needs to be looped once db is available-->
                    <div class = "flex flex-row">
                        <div class = "bookinglabel">
                            Booking {i+1}
                        </div>
                        <div>
                            <i class="fa-solid fa-trash" on:click = {() => openModal(i+1, booking.booking_id)} role = "button"/>
                        </div>
                    </div>
                    <div class = "text-[var(--color-accent)] font-bold text-3xl flex flex-row">
                        <div class = "station-from">
                            {booking.tickets[0].origin}
                        </div>
                        <div class = "text-black">
                            to
                        </div>
                        <div class = "station-to">
                           {booking.tickets[0].destination}
                        </div>
                    </div>
                    <div>
                        <hr class = "bg-black"/>
                    </div>
                    <div class = "flex flex-row gap-x-47 text-md font-bold">
                        <div>
                            Train {booking.tickets[0].train.id}
                        </div>
                        <div>
                            <span class = "text-[var(--color-accent)]">{booking.tickets[0].class}</span> Class
                        </div>
                        <div>
                            Seat{#if booking.tickets.length > 1} s {/if}: <span class = "text-[var(--color-accent)]">
                                        {#each booking.tickets as ticket}
                                            {seatLabel(ticket.seat.car, ticket.seat.row, ticket.seat.column)} &nbsp
                                        {/each}
                                  </span>
                        </div>
                    </div>
                    <div class = "flex flex-row gap-x-41 text-md font-bold">
                        <div>
                            {booking.tickets[0].departure.split('T')[0]}
                        </div>
                        <div>
                            Departs <span class = "text-[var(--color-accent)]">{booking.tickets[0].departure.split('T')[1].split(':')[0]}:{booking.tickets[0].departure.split('T')[1].split(':')[1]}</span>
                        </div>
                        <div>
                            Arrives <span class = "text-[var(--color-accent)]">{booking.tickets[0].arrival.split('T')[1].split(':')[0]}:{booking.tickets[0].arrival.split('T')[1].split(':')[1]}</span>
                        </div>
                    </div>
                </div>
                {/each}
            </div>
        </div>
    </div>

    <div bind:this={modal} class = "modal">
        <div class = "modalcontent">
            <div class = "text-5xl font-bold">
                Cancel <span class = "text-[var(--color-accent)]"> Booking {cancelledBooking}? </span>
            </div>
            <div>
                <button class = "bg-red-500 text-white font-bold px-4 py-2 rounded mr-4" on:click = {() => deleteBooking(cancelledID)} id ="delete">
                    Delete Booking
                </button>
                <button class = "bg-green-300 text-white font-bold px-4 py-2 rounded" on:click = {() => {if (modal) {modal.style.display = "none";}}} id= "keep">
                    Keep Booking
                </button>
            </div>
        </div>
    </div>
</div>

<style>
    .Booking {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        background-color: white;
        padding:20px;
        width: 50vw;
        box-shadow: 2px 2px 5px #aaaaaa;
        display:flex;
        flex-direction: column;
    }

    .station-from {
       width:40%;
    }

    .station-to {
       width:40%;
       text-align: right;
    }

    .bookinglabel {
        width:100%;
    }

    .modal {
        position:fixed;
        z-index: 1;
        right: 0;
        top:0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: rgb(0,0,0);
        background-color: rgba(0,0,0,0.1);
        --webkit-animation-name: fadeIn;
        --webkit-animation-duration: 0.4s;
        animation-name:fadeIn;
        animation-duration: 0.4s;
        display:none;
    }

    .modalcontent {
       display:flex;
       flex-direction: column;
       gap:50px;
       position: fixed;
       padding: 30px;
       right: 0;
       bottom:0;
       background-color: #fefefe;
       width: 50%;
       -webkit-animation-name: slideIn;
       -webkit-animation-duration: 0.4s;
        animation-name: slideIn;
        animation-duration: 0.4s;
        border-radius: 15px 0px 0px ;
        box-shadow: 1px 1px 10px;
    }

    #keep:hover {
        cursor: pointer;
        box-shadow: 5px 5px 5px 2px inset #6AB175;
    }

    #delete:hover {
        cursor: pointer;
        box-shadow: 5px 5px 5px 2px inset #C22B2E;
    }

    i:hover {
        cursor: pointer;
        color: red;
    }
    
    #bookingList{
        position:absolute;
        right:50px;
        top: 275px;
    }

    #nameContainer{
        position:absolute;
        right:275px;
    }

    @-webkit-keyframes slideIn {
        from {bottom: -300px; opacity: 0} 
        to {right: 0; opacity: 1}
    } 

    @keyframes slideIn {
        from {bottom: -300px; opacity: 0}
        to {right: 0; opacity: 1}
    }

    @-webkit-keyframes fadeIn {
        from {opacity: 0} 
        to {opacity: 1}
    }

    @keyframes fadeIn {
        from {opacity: 0} 
        to {opacity: 1}
    }
    
</style>