from concurrent.futures import ThreadPoolExecutor, as_completed, TimeoutError
from concurrent.futures import ProcessPoolExecutor
import time
import random
import math
import asyncio

# -------------------------------------------------------------------
# 1.1 Basic Submit
# Write a function that takes a list of numbers and uses 
# ThreadPoolExecutor with submit() to compute their squares in
# parallel. Return results as a list.

def parallel_squares(numbers: list[int]) -> list[int]:
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(lambda x: x * x, n) for n in numbers]
    return [f.result() for f in futures]

def parallel_squares(numbers: list[int]) -> list[int]:
    with ThreadPoolExecutor(max_workers=4) as executor:
        f1 = []
        for n in numbers:
            f1.append(executor.submit(lambda x: x * x, n))
        print(f1)
        results = [f.result() for f in f1]
    return results
    
def m_1_1():
    result = parallel_squares([1, 2, 3, 4, 5])
    print(result)

# -------------------------------------------------------------------
# 1.2 Using map()
# Rewrite 1.1 using executor.map() instead of submit().

def parallel_squares_map(numbers: list[int]) -> list[int]:
    with ThreadPoolExecutor() as executor:
        futures = executor.map(lambda x: x * x, numbers)
        results = list(futures)
        return results
        
def m_1_2():
    results = parallel_squares_map([1, 2, 3, 4, 5])
    print(results)

# -------------------------------------------------------------------
# 1.3 as_completed
# Process a list of numbers, printing each squared result as soon as it
# completes (not in input order).

def squares_as_completed(numbers: list[int]) -> None:
    # Use as_completed() to print results as they finish
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(lambda x: x * x, n) for n in numbers]
        for f in as_completed(futures):
            print(f.result())

def m_1_3():
    squares_as_completed([1, 2, 3, 4, 5])

# -------------------------------------------------------------------
# 1.4 Timeout Handling
# Submit a task that might be slow. Use future.result(timeout=...)
# to handle the case where it takes too long.

def slow_task():
    time.sleep(random.uniform(0.5, 2.0))
    return "done"

def run_with_timeout(timeout_seconds: float) -> str | None:
    # Submit slow_task, return result or None if timeout
    with ThreadPoolExecutor(max_workers=1) as executor:
        for _ in range(10):
            t0 = time.time()
            future = executor.submit(slow_task)
            try:
                print(future.result(timeout=timeout_seconds), time.time() - t0)
            except TimeoutError as e:
                print("Timeout", time.time() - t0)

def m_1_4():
    run_with_timeout(1.5)

# -------------------------------------------------------------------
# 1.5 ProcessPoolExecutor
# Compute factorial of numbers using ProcessPoolExecutor (simulating CPU-bound work).

def parallel_factorials(numbers: list[int]) -> list[int]:
    # Use ProcessPoolExecutor
    with ProcessPoolExecutor() as executor:
        futures = executor.map(math.factorial, numbers)
        return list(futures)

def m_1_5():
    result = parallel_factorials(range(5))
    print(result)

# -------------------------------------------------------------------
# 1.6 Lock
# Create a shared counter that multiple threads increment.
# Use a Lock to prevent race conditions.

from threading import Lock
# global counter_16, lock_16

def single_counter(increments_per_thread):
    global counter_16
    for _ in range(increments_per_thread):
        with lock_16:
            counter_16 += 1
    
def increment_counter(n_threads: int, increments_per_thread: int) -> int:
    # Each thread increments a shared counter
    # Return final counter value (should equal n_threads * increments_per_thread)
    global counter_16, lock_16
    counter_16 = 0
    lock_16 = Lock()
    with ThreadPoolExecutor() as executor:
        futures = [executor.submit(single_counter,increments_per_thread) for _ in range(n_threads)]
        for _ in as_completed(futures):
            pass
    return counter_16

def m_1_6():
    result = increment_counter(500, 400)
    print(result)

# -------------------------------------------------------------------
# 1.7 Semaphore
# Simulate an API with max 2 concurrent requests. Use a Semaphore to enforce this limit.

from threading import Semaphore

def api_17():
    global sem_17
    t0 = time.time()
    with sem_17:
        time.sleep(1)
    return time.time() - t0
    
def simulate_api_calls(n_calls: int, max_concurrent: int) -> list[str]:
    # Make n_calls, but only max_concurrent can run at once
    # Return list of results
    global sem_17
    sem_17 = Semaphore(max_concurrent)
    with ThreadPoolExecutor() as executor:
        futures = [executor.submit(api_17) for _ in range(n_calls)]
        return [f.result() for f in futures]

def m_1_7():
    result = simulate_api_calls(10, 4)
    print(result)

# -------------------------------------------------------------------
# 1.8 Event
# Start worker threads that run until a stop event is signaled.

from threading import Event

def run_workers_until_stopped(n_workers: int, run_seconds: float) -> int:
    # Start n_workers that increment a counter in a loop
    # After run_seconds, signal them to stop
    # Return total count
    stop_event = Event()
    
    def worker():
        x = 1
        while not stop_event.is_set():
            x += 1
        return x
        
    with ThreadPoolExecutor() as executor:
        futures = [executor.submit(worker) for _ in range(n_workers)]
        time.sleep(run_seconds)
        stop_event.set()
        values = [f.result() for f in futures]
    return sum(values)


def m_1_8():
    result = run_workers_until_stopped(10, 3)
    print(result)

# -------------------------------------------------------------------
# 1.9 Queue (Producer-Consumer)
# Implement a producer that puts numbers 1-10 on a queue,
# and a consumer that reads and prints them.

from queue import Queue
from threading import Thread

def m_1_9():
    
    q = Queue()
    
    def consumer():
        while (item := q.get()) is not None:
            print(item)
        
    def producer():
        for i in range(10):
            q.put(i + 1)
        q.put(None)
            
    pt = Thread(target=producer)
    ct = Thread(target=consumer)
    pt.start()
    ct.start()
    pt.join()
    ct.join()
    print("done")
        
# -------------------------------------------------------------------
# 1.10 Basic gather
# Fetch 3 URLs concurrently using asyncio.gather().
# (Simulate with asyncio.sleep().)

import asyncio

async def fetch(url: str) -> str:
    await asyncio.sleep(0.5)  # simulate network
    return f"content from {url}"

async def fetch_all(urls: list[str]) -> list[str]:
    # Use asyncio.gather
    results = await asyncio.gather(*[fetch(url) for url in urls])
    return results

async def m_1_10a():
    result = await fetch_all(["1", "2", "3 10"])
    print(result)

def m_1_10():
    asyncio.run(m_1_10a())
    
# -------------------------------------------------------------------
# 1.11 create_task
# Same as 1.10 but use asyncio.create_task() explicitly.

async def fetch_all_tasks(urls: list[str]) -> list[str]:
    # Use create_task
    tasks = [asyncio.create_task(fetch(url)) for url in urls]
    results = [await task for task in tasks]
    return results


async def m_1_11a():
    result = await fetch_all_tasks(["1", "2", "3 11"])
    print(result)

def m_1_11():
    asyncio.run(m_1_11a())

# -------------------------------------------------------------------
# 1.12 as_completed (async)
# Print results as they complete (not in order).

async def fetch_as_completed(urls: list[str]) -> None:
    # Print each result as it completes
    tasks = [asyncio.create_task(fetch(url)) for url in urls]
    for task in asyncio.as_completed(tasks):
        result = await task
        print(result)

async def m_1_12a():
    await fetch_as_completed(["1", "2", "3 12"])

def m_1_12():
    asyncio.run(m_1_12a())

# -------------------------------------------------------------------
# 1.13 Timeout (async)
# Fetch with a timeout, return None if it times out.

async def fetch_slow(url: str) -> str:
    await asyncio.sleep(2.0)
    return f"content from {url}"

async def fetch_with_timeout(url: str, timeout: float) -> str | None:
    # Return content or None if timeout
    try:
        result = await asyncio.wait_for(fetch_slow(url), timeout=timeout)
        return result
    except TimeoutError:
        return None
        
async def m_1_13a():
    print(await fetch_with_timeout("3 13", .5))
    print(await fetch_with_timeout("3 13", 5))

def m_1_13():
    asyncio.run(m_1_13a())

# -------------------------------------------------------------------
# 1.14 Semaphore (async)
# Limit concurrent fetches to 2 at a time.

from asyncio import Semaphore as aSemaphore
# global sem

async def fetch_with_sem(url):
    global sem_14
    async with sem_14:
        return await(fetch(url))

async def fetch_limited(urls: list[str], max_concurrent: int) -> list[str]:
    # Use asyncio.Semaphore to limit concurrency
    global sem_14
    sem_14 = aSemaphore(max_concurrent)
    results = await asyncio.gather(*[fetch_with_sem(url) for url in urls])
    return results


async def m_1_14a():
    results = await fetch_limited(["1", "2", "3 14", "4", "5", "6"], 2)
    print(results)

def m_1_14():
    asyncio.run(m_1_14a())

# -------------------------------------------------------------------
# 1.15 Queue (async)
# Implement async producer-consumer with asyncio.Queue.

async def async_producer_consumer():
    # Producer puts items 1-10
    # Consumer processes them
    queue = asyncio.Queue()

    async def producer():
        for n in range(10):
            await queue.put(n + 1)
        await queue.put(None)
    
    async def consumer():
        while (item := await queue.get()) is not None:
            print(item)
            queue.task_done()            
        queue.task_done()
        print('done')

    await asyncio.gather(producer(), consumer())

async def m_1_15a():
    await async_producer_consumer()

def m_1_15():
    asyncio.run(m_1_15a())

# -------------------------------------------------------------------

if __name__ == "__main__":
    m_1_15()
