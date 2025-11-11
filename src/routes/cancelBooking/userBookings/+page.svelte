<script lang="ts">
	import Header from '$lib/components/Header.svelte';
    import TrainMap from '$lib/components/TrainMap.svelte';
</script>

<div> <!--Container Div-->
   <Header/>
   <div class = "flex flex-row gap-x-30">
        <TrainMap/>
        <div class = "mt-20 flex flex-col gap-y-5"> <!-- Name and Bookings List-->
            <div class = "text-3xl font-bold text-[var(--color-accent)]">
                [USERNAME]'s Bookings
            </div> 
            <div class = "flex flex-col gap-y-5"> <!--Bookings List-->
                <div class = "Booking"> <!--Booking-->
                    <div>
                        Booking 1
                    </div>
                    <div class = "text-[var(--color-accent)] font-bold text-3xl flex flex-row">
                        <div class = "station-from">
                            Shin-Osaka
                        </div>
                        <div class = "text-black">
                            to
                        </div>
                        <div class = "station-to">
                           Shin-Yokohama 
                        </div>
                    </div>
                    <div>
                        <hr class = "bg-black"/>
                    </div>
                    <div class = "flex flex-row gap-x-40 text-md font-bold">
                        <div>
                            Train XXXX
                        </div>
                        <div>
                            <span class = "text-[var(--color-accent)]">Business</span> Class
                        </div>
                        <div>
                            Seat: <span class = "text-[var(--color-accent)]">2-D4C</span>
                        </div>
                    </div>
                    <div class = "flex flex-row gap-x-41 text-md font-bold">
                        <div>
                            mm/dd/yy
                        </div>
                        <div>
                            Departs <span class = "text-[var(--color-accent)]">0:00</span>
                        </div>
                        <div>
                            Arrives <span class = "text-[var(--color-accent)]">0:00</span>
                        </div>
                    </div>
                </div>
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
    
</style>