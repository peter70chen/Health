on run argv
    set searchQuery to ""
    set searchDays to 90
    
    if (count of argv) > 0 then
        set searchQuery to item 1 of argv
    else
        return "Error: Please provide a search query."
    end if
    
    if (count of argv) > 1 then
        set searchDays to item 2 of argv as integer
    end if
    
    set cutoffDate to (current date) - (searchDays * days)
    
    tell application "Mail"
        -- Optimization: getting messages by date constraint first is usually faster than content search
        -- Searching in all mailboxes of inbox (consolidated inbox)
        set foundMessages to (every message of inbox whose date received is greater than cutoffDate and (subject contains searchQuery or sender contains searchQuery))
        
        set msgCount to count of foundMessages
        if msgCount is 0 then
            return "No messages found matching '" & searchQuery & "' in the last " & searchDays & " days."
        end if
        
        set output to "Found " & msgCount & " messages matching '" & searchQuery & "' in the last " & searchDays & " days:\n"
        
        -- Sort or just list? Listing top 20 to avoid overflow
        set displayCount to msgCount
        if displayCount > 50 then
            set displayCount to 50
        end if
        
        repeat with i from 1 to displayCount
            set thisMsg to item i of foundMessages
            set msgSubject to subject of thisMsg
            set msgSender to sender of thisMsg
            set msgDate to date received of thisMsg
            
            set output to output & i & ". [" & short date string of msgDate & "] From: " & msgSender & " | Subject: " & msgSubject & "\n"
        end repeat
        
        if displayCount < msgCount then
            set output to output & "... and " & (msgCount - displayCount) & " more."
        end if
        
        return output
    end tell
end run
