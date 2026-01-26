on run argv
    set senderQuery to ""
    set subjectQuery to ""
    set searchDays to 120
    
    if (count of argv) > 0 then
        set senderQuery to item 1 of argv
    end if
    
    if (count of argv) > 1 then
        set subjectQuery to item 2 of argv
    end if
    
    if (count of argv) > 2 then
        set searchDays to item 3 of argv as integer
    end if
    
    set cutoffDate to (current date) - (searchDays * days)
    
    tell application "Mail"
        -- Get recent messages first to reduce scope
        set recentMessages to (every message of inbox whose date received is greater than cutoffDate)
        
        set output to ""
        set matchCount to 0
        
        repeat with msg in recentMessages
            set isMatch to true
            
            if senderQuery is not "" then
                if sender of msg does not contain senderQuery then
                    set isMatch to false
                end if
            end if
            
            if isMatch is true and subjectQuery is not "" then
                if subject of msg does not contain subjectQuery then
                    set isMatch to false
                end if
            end if
            
            if isMatch is true then
                set matchCount to matchCount + 1
                set msgSubject to subject of msg
                set msgSender to sender of msg
                set msgDate to date received of msg
                set output to output & matchCount & ". [" & short date string of msgDate & "] From: " & msgSender & " | Subject: " & msgSubject & "\n"
            end if
        end repeat
        
        if matchCount is 0 then
            return "No messages found matching Sender: '" & senderQuery & "' AND Subject: '" & subjectQuery & "' in the last " & searchDays & " days."
        end if
        
        return "Found " & matchCount & " matching messages:\n" & output
    end tell
end run
