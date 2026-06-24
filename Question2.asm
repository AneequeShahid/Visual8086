org 100h


 
    mov ah, 02h
    mov dl, '?'
    int 21h

  
    mov ah, 01h
    int 21h
    mov bl, al    

    
    mov ah, 01h
    int 21h
    mov bh, al     

   
    mov cl, bl
    add cl, bh
    sub cl, 30h     

   
    mov ah, 09h
    lea dx, msg1
    int 21h
    
   
    mov ah, 02h
    mov dl, bl
    int 21h
    
   
    mov ah, 09h
    lea dx, msg2
    int 21h
    
    
    mov ah, 02h
    mov dl, bh
    int 21h
    
   
    mov ah, 09h
    lea dx, msg3
    int 21h
    
   
    mov ah, 02h
    mov dl, cl
    int 21h

   
    ret


    msg1 db 10, 13, 'THE SUM OF $'
    msg2 db ' AND $'
    msg3 db ' IS $'