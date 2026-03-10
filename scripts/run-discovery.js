#!/usr/bin/env node

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Attempt ${i + 1} failed for ${url}:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

async function discoverNiches() {
  console.log('🔍 Discovering new niches...');
  try {
    const response = await fetchWithRetry(`${BASE_URL}/api/discover-niches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`✅ Discovered ${response.niches?.length || 0} new niches`);
    return response.niches || [];
  } catch (error) {
    console.error('❌ Failed to discover niches:', error.message);
    return [];
  }
}

async function generateKeywords(niches) {
  console.log('🔑 Generating keywords for niches...');
  let totalKeywords = 0;
  
  for (const niche of niches) {
    try {
      console.log(`Processing niche: ${niche.name}`);
      const response = await fetchWithRetry(`${BASE_URL}/api/generate-keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nicheId: niche.id })
      });
      
      totalKeywords += response.keywords?.length || 0;
      console.log(`✅ Generated ${response.keywords?.length || 0} keywords for ${niche.name}`);
    } catch (error) {
      console.error(`❌ Failed to generate keywords for ${niche.name}:`, error.message);
    }
  }
  
  console.log(`✅ Total keywords generated: ${totalKeywords}`);
  return totalKeywords;
}

async function fetchSERPData() {
  console.log('🔍 Fetching SERP data for keywords...');
  let processedCount = 0;
  
  try {
    // Get keywords that need SERP data (older than 30 days or null)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const response = await fetchWithRetry(`${BASE_URL}/api/keywords-needing-serp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        limit: 10, // Stay within free limits
        olderThan: thirtyDaysAgo.toISOString()
      })
    });
    
    const keywords = response.keywords || [];
    console.log(`Found ${keywords.length} keywords needing SERP data`);
    
    for (const keyword of keywords.slice(0, 10)) { // Process max 10 keywords
      try {
        console.log(`Fetching SERP for: ${keyword.keyword}`);
        await fetchWithRetry(`${BASE_URL}/api/fetch-serp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keywordId: keyword.id })
        });
        
        processedCount++;
        console.log(`✅ Processed: ${keyword.keyword}`);
        
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Failed to fetch SERP for ${keyword.keyword}:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ Failed to get keywords needing SERP:', error.message);
  }
  
  console.log(`✅ Total SERP data processed: ${processedCount}`);
  return processedCount;
}

async function main() {
  console.log('🚀 Starting daily opportunity update workflow');
  console.log(`📍 Target API: ${BASE_URL}`);
  
  try {
    // Step 1: Discover new niches
    const niches = await discoverNiches();
    
    // Step 2: Generate keywords for new niches (or all niches without keywords)
    await generateKeywords(niches);
    
    // Step 3: Fetch SERP data for keywords that need updating
    await fetchSERPData();
    
    console.log('🎉 Daily update completed successfully!');
  } catch (error) {
    console.error('💥 Daily update failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
